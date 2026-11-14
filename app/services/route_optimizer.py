"""
Route optimizer: A* on the walkable graph + nearest-neighbour TSP.
All inputs are dicts/lists to keep this module free of DB dependencies.
"""
import math
import heapq
from typing import List, Dict, Tuple, Optional

def euclidean(a: dict, b: dict) -> float:
    return math.sqrt((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2)

def build_adjacency(nodes: List[dict], edges: List[dict]) -> Dict[int, List[Tuple[int, float]]]:
    adj: Dict[int, List[Tuple[int, float]]] = {n["id"]: [] for n in nodes}
    for e in edges:
        adj[e["from_node_id"]].append((e["to_node_id"], e["weight"]))
        adj[e["to_node_id"]].append((e["from_node_id"], e["weight"]))
    return adj

def astar(
    nodes_by_id: Dict[int, dict],
    adj: Dict[int, List[Tuple[int, float]]],
    start_id: int,
    goal_id: int,
) -> Tuple[float, List[int]]:
    """Returns (cost, path_node_ids). Returns (inf, []) if no path."""
    goal = nodes_by_id[goal_id]
    open_heap = [(0.0, 0.0, start_id, [start_id])]
    best_g: Dict[int, float] = {start_id: 0.0}

    while open_heap:
        f, g, current, path = heapq.heappop(open_heap)
        if current == goal_id:
            return g, path
        if g > best_g.get(current, float("inf")):
            continue
        for neighbor_id, weight in adj.get(current, []):
            ng = g + weight
            if ng < best_g.get(neighbor_id, float("inf")):
                best_g[neighbor_id] = ng
                h = euclidean(nodes_by_id[neighbor_id], goal)
                heapq.heappush(open_heap, (ng + h, ng, neighbor_id, path + [neighbor_id]))
    return float("inf"), []

def nearest_neighbour_order(stops: List[dict], start_id: int, nodes_by_id: dict, adj: dict) -> List[dict]:
    """
    stops: list of {"node_id": int, ...}
    Returns reordered stops using nearest-neighbour heuristic.
    """
    if not stops:
        return []
    remaining = list(stops)
    ordered = []
    current_id = start_id

    while remaining:
        best_cost = float("inf")
        best_stop = None
        best_idx = -1
        for i, stop in enumerate(remaining):
            cost, _ = astar(nodes_by_id, adj, current_id, stop["node_id"])
            if cost < best_cost:
                best_cost = cost
                best_stop = stop
                best_idx = i
        ordered.append(best_stop)
        current_id = best_stop["node_id"]
        remaining.pop(best_idx)

    return ordered

def two_opt_improve(ordered: List[dict], start_id: int, end_id: int, nodes_by_id: dict, adj: dict) -> List[dict]:
    """Simple 2-opt pass."""
    improved = True
    best = list(ordered)
    while improved:
        improved = False
        for i in range(len(best) - 1):
            for j in range(i + 2, len(best)):
                new_order = best[:i+1] + best[i+1:j+1][::-1] + best[j+1:]
                old_cost = _route_cost(best, start_id, end_id, nodes_by_id, adj)
                new_cost = _route_cost(new_order, start_id, end_id, nodes_by_id, adj)
                if new_cost < old_cost - 0.01:
                    best = new_order
                    improved = True
    return best

def _route_cost(stops: List[dict], start_id: int, end_id: int, nodes_by_id: dict, adj: dict) -> float:
    if not stops:
        return 0
    total = 0
    current = start_id
    for stop in stops:
        c, _ = astar(nodes_by_id, adj, current, stop["node_id"])
        total += c
        current = stop["node_id"]
    c, _ = astar(nodes_by_id, adj, current, end_id)
    return total + c

def build_route(
    nodes: List[dict],
    edges: List[dict],
    stops: List[dict],
    entrance_id: int,
    checkout_id: int,
) -> dict:
    """
    Main entry point.
    stops: [{"node_id": int, "product_id": int, "product_name": str, "aisle_name": str, "shelf_name": str, "x": float, "y": float, "instruction": str}]
    Returns dict with keys: stops (ordered), path_coords, total_distance, estimated_minutes, instructions
    """
    nodes_by_id = {n["id"]: n for n in nodes}
    adj = build_adjacency(nodes, edges)

    # Nearest-neighbour order
    ordered = nearest_neighbour_order(stops, entrance_id, nodes_by_id, adj)
    # 2-opt (only worthwhile for 4+ stops)
    if len(ordered) >= 4:
        ordered = two_opt_improve(ordered, entrance_id, checkout_id, nodes_by_id, adj)

    # Build full path
    full_path: List[dict] = []
    total_dist = 0.0
    current_id = entrance_id

    for stop in ordered:
        cost, path_ids = astar(nodes_by_id, adj, current_id, stop["node_id"])
        total_dist += cost
        for nid in path_ids:
            n = nodes_by_id[nid]
            full_path.append({"x": n["x"], "y": n["y"]})
        current_id = stop["node_id"]

    # Path to checkout
    cost, path_ids = astar(nodes_by_id, adj, current_id, checkout_id)
    total_dist += cost
    for nid in path_ids:
        n = nodes_by_id[nid]
        full_path.append({"x": n["x"], "y": n["y"]})

    # ~0.8 m/s walking speed, map scale 1 unit ≈ 0.1 m
    estimated_minutes = round((total_dist * 0.1) / (0.8 * 60), 1)

    instructions = ["🚶 Start at the store entrance"]
    for i, stop in enumerate(ordered, 1):
        instructions.append(f"➡️  Stop {i}: {stop['instruction']}")
    instructions.append("🧾 Proceed to Checkout — you're done!")

    return {
        "stops": ordered,
        "path_coords": full_path,
        "total_distance": round(total_dist, 1),
        "estimated_minutes": estimated_minutes,
        "instructions": instructions,
    }
