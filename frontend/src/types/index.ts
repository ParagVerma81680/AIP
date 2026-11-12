export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  image_url?: string | null;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  brand?: string | null;
  category_id?: number | null;
  category?: Category | null;
  description?: string | null;
  image_url?: string | null;
  quantity_label?: string | null;
  price: number;
  original_price?: number | null;
  discount_pct: number;
  stock: number;
  is_available: boolean;
  shelf_id?: number | null;
  shelf_x?: number | null;
  shelf_y?: number | null;
}

export interface CartItem {
  id?: number; // Backend CartItem id if synced
  product_id: number;
  quantity: number;
  product: Product;
}

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  is_admin: boolean;
  created_at?: string;
}

export interface Address {
  id: number;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product: Product;
}

export interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | string;
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  notes?: string | null;
  created_at?: string;
  items: OrderItem[];
}

export interface Shelf {
  id: number;
  name?: string | null;
  x?: number | null;
  y?: number | null;
  width: number;
  height: number;
}

export interface Aisle {
  id: number;
  name: string;
  aisle_number?: number | null;
  shelves: Shelf[];
}

export interface StoreSection {
  id: number;
  name: string;
  color: string;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  aisles: Aisle[];
}

export interface WalkableNode {
  id: number;
  x: number;
  y: number;
  label?: string | null;
}

export interface WalkableEdge {
  id: number;
  from_node_id: number;
  to_node_id: number;
  weight: number;
}

export interface StoreMapData {
  sections: StoreSection[];
  nodes: WalkableNode[];
  edges: WalkableEdge[];
}

export interface RouteStop {
  order_in_route?: number;
  product_id?: number | null;
  product_name?: string | null;
  aisle_name?: string | null;
  shelf_name?: string | null;
  category_name?: string;
  shelf_label?: string;
  x: number;
  y: number;
  node_id?: number;
  instruction?: string;
  picked?: boolean;
}

export interface PathCoord {
  x: number;
  y: number;
}

export interface RouteResponse {
  stops: RouteStop[];
  path_coords: PathCoord[];
  total_distance: number;
  estimated_minutes: number;
  instructions: string[];
}

export interface StoreMap {
  id: number;
  name: string;
  width: number;
  height: number;
  grid_resolution: number;
  entrance_x: number;
  entrance_y: number;
  checkout_x: number;
  checkout_y: number;
}

export interface AdminStats {
  total_products: number;
  total_users: number;
  total_orders: number;
  total_revenue: number;
  in_store_route_requests: number;
}

export interface AdminShelf {
  id: number;
  name: string;
  aisle_id: number;
  aisle_name?: string;
  aisle_number?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface AdminOrderCustomer {
  id?: number | null;
  email: string;
  full_name?: string | null;
  phone?: string | null;
}

export interface AdminOrderAddress {
  id: number;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
}

export interface AdminOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: {
    id: number;
    name: string;
    image_url?: string | null;
    price: number;
    shelf_id?: number | null;
    quantity_label?: string | null;
  } | null;
}

export interface AdminOrder {
  id: number;
  status: string;
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  notes?: string | null;
  created_at?: string;
  customer?: AdminOrderCustomer | null;
  address?: AdminOrderAddress | null;
  items: AdminOrderItem[];
}


export interface AIProductInfo {
  id: number;
  name: string;
  brand?: string | null;
  price: number;
  original_price?: number | null;
  discount_pct?: number;
  quantity_label?: string | null;
  image_url?: string | null;
  aisle_name?: string | null;
  shelf_name?: string | null;
  section_name?: string | null;
  shelf_x?: number | null;
  shelf_y?: number | null;
  is_available?: boolean;
}

export interface AIRouteSummary {
  total_distance?: number;
  estimated_minutes?: number;
  stops_count: number;
  product_ids: number[];
  instructions?: string[];
}

export interface AIChatResponse {
  reply: string;
  conversation_id: number;
  tool_results?: any[];
  suggested_products?: number[];
  products_data?: AIProductInfo[];
  route_generated?: boolean;
  route_summary?: AIRouteSummary | null;
  action?: 'none' | 'locate_product' | 'add_cart' | 'view_route' | string;
  quick_suggestions?: string[];
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  products?: AIProductInfo[];
  routeSummary?: AIRouteSummary | null;
  routeGenerated?: boolean;
  action?: string;
  quickSuggestions?: string[];
}
