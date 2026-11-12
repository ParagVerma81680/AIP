"""
SwiftMart Database Seed Script
Populates categories, store layout (sections, aisles, shelves),
walkable graph (nodes, edges), products, and demo accounts.
"""

import asyncio
import math
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import engine, AsyncSessionLocal, Base
import app.models  # register all models on Base.metadata
from app.models.user import User
from app.models.address import Address
from app.models.cart import Cart
from app.models.product import Category, Product
from app.models.store import StoreSection, Aisle, Shelf, WalkableNode, WalkableEdge
from app.core.security import get_password_hash


# ---------------------------------------------------------
# 1. Categories Data
# ---------------------------------------------------------
CATEGORIES_DATA = [
    {
        "name": "Fruits & Vegetables",
        "slug": "fruits-vegetables",
        "icon": "🥦",
        "image_url": "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80",
        "sort_order": 1,
    },
    {
        "name": "Dairy, Bread & Eggs",
        "slug": "dairy-bread-eggs",
        "icon": "🥛",
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
        "sort_order": 2,
    },
    {
        "name": "Snacks & Munchies",
        "slug": "snacks-munchies",
        "icon": "🍿",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        "sort_order": 3,
    },
    {
        "name": "Cold Drinks & Juices",
        "slug": "cold-drinks-juices",
        "icon": "🥤",
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        "sort_order": 4,
    },
    {
        "name": "Atta, Rice, Oil & Dals",
        "slug": "atta-rice-oil-dals",
        "icon": "🌾",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
        "sort_order": 5,
    },
    {
        "name": "Masala & Spices",
        "slug": "masala-spices",
        "icon": "🌶️",
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
        "sort_order": 6,
    },
    {
        "name": "Bakery & Biscuits",
        "slug": "bakery-biscuits",
        "icon": "🍪",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        "sort_order": 7,
    },
    {
        "name": "Personal Care",
        "slug": "personal-care",
        "icon": "🧴",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        "sort_order": 8,
    },
    {
        "name": "Cleaning & Household",
        "slug": "cleaning-household",
        "icon": "🧹",
        "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80",
        "sort_order": 9,
    },
    {
        "name": "Instant Food & Noodles",
        "slug": "instant-food-noodles",
        "icon": "🍜",
        "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
        "sort_order": 10,
    },
]


# ---------------------------------------------------------
# 2. Store Layout Data (Sections, Aisles, Shelves)
# ---------------------------------------------------------
# Floorplan coordinate space: ~800 x 600 px
SECTIONS_DATA = [
    {
        "key": "personal_household",
        "name": "Personal Care & Household",
        "color": "#E0F2FE",  # soft light sky blue
        "x": 60, "y": 40, "width": 680, "height": 110,
        "aisles": [
            {
                "key": "aisle_personal",
                "name": "Personal Care",
                "aisle_number": 1,
                "shelves": [
                    {"key": "sh_oral_soaps", "name": "Oral Care & Soaps", "x": 120, "y": 65, "width": 90, "height": 30},
                    {"key": "sh_hair_skin", "name": "Hair & Skin Care", "x": 250, "y": 65, "width": 90, "height": 30},
                ]
            },
            {
                "key": "aisle_cleaning",
                "name": "Cleaning & Household",
                "aisle_number": 2,
                "shelves": [
                    {"key": "sh_laundry", "name": "Laundry & Detergents", "x": 440, "y": 65, "width": 90, "height": 30},
                    {"key": "sh_cleaners", "name": "Cleaners & Paper Goods", "x": 570, "y": 65, "width": 90, "height": 30},
                ]
            }
        ]
    },
    {
        "key": "fresh_produce",
        "name": "Fresh Produce",
        "color": "#DCFCE7",  # soft light green
        "x": 60, "y": 170, "width": 200, "height": 290,
        "aisles": [
            {
                "key": "aisle_fruits",
                "name": "Fresh Fruits",
                "aisle_number": 3,
                "shelves": [
                    {"key": "sh_seasonal_fruits", "name": "Seasonal & Exotic Fruits", "x": 65, "y": 210, "width": 60, "height": 35},
                    {"key": "sh_citrus_apples", "name": "Apples, Pears & Citrus", "x": 65, "y": 295, "width": 60, "height": 35},
                    {"key": "sh_bananas_melons", "name": "Bananas, Papaya & Melons", "x": 65, "y": 380, "width": 60, "height": 35},
                ]
            },
            {
                "key": "aisle_veggies",
                "name": "Fresh Vegetables",
                "aisle_number": 4,
                "shelves": [
                    {"key": "sh_root_veg", "name": "Potatoes, Onions & Roots", "x": 165, "y": 210, "width": 60, "height": 35},
                    {"key": "sh_daily_veg", "name": "Tomatoes, Capsicum & Daily Veg", "x": 165, "y": 295, "width": 60, "height": 35},
                    {"key": "sh_leafy_herbs", "name": "Leafy Greens, Herbs & Chillies", "x": 165, "y": 380, "width": 60, "height": 35},
                ]
            }
        ]
    },
    {
        "key": "grocery_essentials",
        "name": "Grocery Essentials",
        "color": "#FEF3C7",  # soft warm amber
        "x": 280, "y": 170, "width": 240, "height": 290,
        "aisles": [
            {
                "key": "aisle_grains",
                "name": "Grains & Staples",
                "aisle_number": 5,
                "shelves": [
                    {"key": "sh_atta_flours", "name": "Atta & Specialty Flours", "x": 300, "y": 210, "width": 65, "height": 35},
                    {"key": "sh_rice_basmati", "name": "Rice & Basmati", "x": 300, "y": 295, "width": 65, "height": 35},
                    {"key": "sh_dals_pulses", "name": "Dals & Pulses", "x": 300, "y": 380, "width": 65, "height": 35},
                ]
            },
            {
                "key": "aisle_dairy_oil",
                "name": "Dairy & Cooking Essentials",
                "aisle_number": 6,
                "shelves": [
                    {"key": "sh_milk_paneer", "name": "Milk, Paneer & Curd", "x": 430, "y": 210, "width": 65, "height": 35},
                    {"key": "sh_butter_eggs", "name": "Butter, Cheese & Eggs", "x": 430, "y": 295, "width": 65, "height": 35},
                    {"key": "sh_cooking_oils", "name": "Cooking Oils & Pure Ghee", "x": 430, "y": 380, "width": 65, "height": 35},
                ]
            }
        ]
    },
    {
        "key": "packaged_beverages",
        "name": "Packaged & Beverages",
        "color": "#FCE7F3",  # soft light rose
        "x": 540, "y": 170, "width": 200, "height": 290,
        "aisles": [
            {
                "key": "aisle_snacks",
                "name": "Snacks & Instant Foods",
                "aisle_number": 7,
                "shelves": [
                    {"key": "sh_chips_namkeen", "name": "Chips, Crisps & Namkeen", "x": 545, "y": 210, "width": 60, "height": 35},
                    {"key": "sh_biscuits_cookies", "name": "Biscuits & Cookies", "x": 545, "y": 295, "width": 60, "height": 35},
                    {"key": "sh_instant_noodles", "name": "Instant Noodles & Pasta", "x": 545, "y": 380, "width": 60, "height": 35},
                ]
            },
            {
                "key": "aisle_beverages",
                "name": "Drinks, Tea & Spices",
                "aisle_number": 8,
                "shelves": [
                    {"key": "sh_spices_masala", "name": "Spices & Whole Masalas", "x": 655, "y": 210, "width": 60, "height": 35},
                    {"key": "sh_cold_drinks", "name": "Cold Drinks & Juices", "x": 655, "y": 295, "width": 60, "height": 35},
                    {"key": "sh_tea_coffee_water", "name": "Tea, Coffee & Mineral Water", "x": 655, "y": 380, "width": 60, "height": 35},
                ]
            }
        ]
    }
]


# ---------------------------------------------------------
# 3. Walkable Graph Data (Nodes & Edges)
# ---------------------------------------------------------
# Clean walkable grid connecting Entrance (100, 550) to Checkout (650, 550)
# and all aisles & shelves
NODES_DATA = [
    # Key Special Points
    {"key": "entrance", "x": 100.0, "y": 550.0, "label": "entrance"},
    {"key": "checkout", "x": 650.0, "y": 550.0, "label": "checkout"},

    # Concourse South (y = 510)
    {"key": "c_south_100", "x": 100.0, "y": 510.0, "label": "Entrance Concourse"},
    {"key": "c_south_145", "x": 145.0, "y": 510.0, "label": "Produce South Aisle Entry"},
    {"key": "c_south_250", "x": 250.0, "y": 510.0, "label": "South Central Walkway West"},
    {"key": "c_south_365", "x": 365.0, "y": 510.0, "label": "Grocery South Aisle Entry"},
    {"key": "c_south_505", "x": 505.0, "y": 510.0, "label": "South Central Walkway East"},
    {"key": "c_south_615", "x": 615.0, "y": 510.0, "label": "Packaged South Aisle Entry"},
    {"key": "c_south_650", "x": 650.0, "y": 510.0, "label": "Checkout Concourse"},

    # South Cross Aisle (y = 460)
    {"key": "cross_s_100", "x": 100.0, "y": 460.0, "label": "Produce Outer South"},
    {"key": "cross_s_145", "x": 145.0, "y": 460.0, "label": "Produce Inner South"},
    {"key": "cross_s_250", "x": 250.0, "y": 460.0, "label": "Produce-Grocery Hub South"},
    {"key": "cross_s_365", "x": 365.0, "y": 460.0, "label": "Grocery Inner South"},
    {"key": "cross_s_505", "x": 505.0, "y": 505.0, "label": "Grocery-Packaged Hub South"},
    {"key": "cross_s_615", "x": 615.0, "y": 460.0, "label": "Packaged Inner South"},
    {"key": "cross_s_650", "x": 650.0, "y": 460.0, "label": "Packaged Outer South"},

    # Middle Level 3 (y = 397)
    {"key": "mid3_100", "x": 100.0, "y": 397.0, "label": "Produce Outer Mid-3"},
    {"key": "mid3_145", "x": 145.0, "y": 397.0, "label": "Produce Pickup (Bananas & Leafy Greens)"},
    {"key": "mid3_250", "x": 250.0, "y": 397.0, "label": "Produce-Grocery Corridor Mid-3"},
    {"key": "mid3_365", "x": 365.0, "y": 397.0, "label": "Grocery Pickup (Dals & Cooking Oils)"},
    {"key": "mid3_505", "x": 505.0, "y": 397.0, "label": "Grocery-Packaged Corridor Mid-3"},
    {"key": "mid3_615", "x": 615.0, "y": 397.0, "label": "Packaged Pickup (Noodles & Water)"},
    {"key": "mid3_650", "x": 650.0, "y": 397.0, "label": "Packaged Outer Mid-3"},

    # Middle Level 2 (y = 312)
    {"key": "mid2_100", "x": 100.0, "y": 312.0, "label": "Produce Outer Mid-2"},
    {"key": "mid2_145", "x": 145.0, "y": 312.0, "label": "Produce Pickup (Apples & Tomatoes)"},
    {"key": "mid2_250", "x": 250.0, "y": 312.0, "label": "Produce-Grocery Corridor Mid-2"},
    {"key": "mid2_365", "x": 365.0, "y": 312.0, "label": "Grocery Pickup (Rice & Butter/Eggs)"},
    {"key": "mid2_505", "x": 505.0, "y": 312.0, "label": "Grocery-Packaged Corridor Mid-2"},
    {"key": "mid2_615", "x": 615.0, "y": 312.0, "label": "Packaged Pickup (Biscuits & Cold Drinks)"},
    {"key": "mid2_650", "x": 650.0, "y": 312.0, "label": "Packaged Outer Mid-2"},

    # Middle Level 1 (y = 227)
    {"key": "mid1_100", "x": 100.0, "y": 227.0, "label": "Produce Outer Mid-1"},
    {"key": "mid1_145", "x": 145.0, "y": 227.0, "label": "Produce Pickup (Mangoes & Potatoes)"},
    {"key": "mid1_250", "x": 250.0, "y": 227.0, "label": "Produce-Grocery Corridor Mid-1"},
    {"key": "mid1_365", "x": 365.0, "y": 227.0, "label": "Grocery Pickup (Atta & Milk/Paneer)"},
    {"key": "mid1_505", "x": 505.0, "y": 227.0, "label": "Grocery-Packaged Corridor Mid-1"},
    {"key": "mid1_615", "x": 615.0, "y": 227.0, "label": "Packaged Pickup (Chips & Spices)"},
    {"key": "mid1_650", "x": 650.0, "y": 227.0, "label": "Packaged Outer Mid-1"},

    # North Cross Aisle (y = 170)
    {"key": "cross_n_100", "x": 100.0, "y": 170.0, "label": "Produce North Outer"},
    {"key": "cross_n_145", "x": 145.0, "y": 170.0, "label": "Produce North Inner"},
    {"key": "cross_n_250", "x": 250.0, "y": 170.0, "label": "Produce-Grocery Hub North"},
    {"key": "cross_n_365", "x": 365.0, "y": 170.0, "label": "Grocery North Inner"},
    {"key": "cross_n_505", "x": 505.0, "y": 170.0, "label": "Grocery-Packaged Hub North"},
    {"key": "cross_n_615", "x": 615.0, "y": 170.0, "label": "Packaged North Inner"},
    {"key": "cross_n_650", "x": 650.0, "y": 170.0, "label": "Packaged North Outer"},

    # Back Section Concourse (y = 120)
    {"key": "back_100", "x": 100.0, "y": 120.0, "label": "Personal Care West Entry"},
    {"key": "back_165", "x": 165.0, "y": 120.0, "label": "Pickup Oral Care & Soaps"},
    {"key": "back_250", "x": 250.0, "y": 120.0, "label": "Personal Care Center Hub"},
    {"key": "back_295", "x": 295.0, "y": 120.0, "label": "Pickup Hair & Skin Care"},
    {"key": "back_365", "x": 365.0, "y": 120.0, "label": "Household Central Entry"},
    {"key": "back_485", "x": 485.0, "y": 120.0, "label": "Pickup Laundry & Detergents"},
    {"key": "back_505", "x": 505.0, "y": 120.0, "label": "Household East Hub"},
    {"key": "back_615", "x": 615.0, "y": 120.0, "label": "Pickup Cleaners & Paper Goods"},
    {"key": "back_650", "x": 650.0, "y": 120.0, "label": "Household East Exit"},
]

# Unidirectional edges list (route optimizer treats them symmetrically)
EDGES_PAIRS = [
    # Entrance & Checkout connections
    ("entrance", "c_south_100"),
    ("checkout", "c_south_650"),

    # Concourse South (y = 510) horizontal chain
    ("c_south_100", "c_south_145"),
    ("c_south_145", "c_south_250"),
    ("c_south_250", "c_south_365"),
    ("c_south_365", "c_south_505"),
    ("c_south_505", "c_south_615"),
    ("c_south_615", "c_south_650"),

    # South Concourse (510) to South Cross Aisle (460) vertical links
    ("c_south_100", "cross_s_100"),
    ("c_south_145", "cross_s_145"),
    ("c_south_250", "cross_s_250"),
    ("c_south_365", "cross_s_365"),
    ("c_south_505", "cross_s_505"),
    ("c_south_615", "cross_s_615"),
    ("c_south_650", "cross_s_650"),

    # South Cross Aisle (y = 460) horizontal chain
    ("cross_s_100", "cross_s_145"),
    ("cross_s_145", "cross_s_250"),
    ("cross_s_250", "cross_s_365"),
    ("cross_s_365", "cross_s_505"),
    ("cross_s_505", "cross_s_615"),
    ("cross_s_615", "cross_s_650"),

    # Vertical corridor chains from y = 460 -> 397 -> 312 -> 227 -> 170
    # Column x = 100
    ("cross_s_100", "mid3_100"),
    ("mid3_100", "mid2_100"),
    ("mid2_100", "mid1_100"),
    ("mid1_100", "cross_n_100"),

    # Column x = 145 (Produce Aisle)
    ("cross_s_145", "mid3_145"),
    ("mid3_145", "mid2_145"),
    ("mid2_145", "mid1_145"),
    ("mid1_145", "cross_n_145"),

    # Column x = 250 (Produce-Grocery Corridor)
    ("cross_s_250", "mid3_250"),
    ("mid3_250", "mid2_250"),
    ("mid2_250", "mid1_250"),
    ("mid1_250", "cross_n_250"),

    # Column x = 365 (Grocery Aisle)
    ("cross_s_365", "mid3_365"),
    ("mid3_365", "mid2_365"),
    ("mid2_365", "mid1_365"),
    ("mid1_365", "cross_n_365"),

    # Column x = 505 (Grocery-Packaged Corridor)
    ("cross_s_505", "mid3_505"),
    ("mid3_505", "mid2_505"),
    ("mid2_505", "mid1_505"),
    ("mid1_505", "cross_n_505"),

    # Column x = 615 (Packaged Aisle)
    ("cross_s_615", "mid3_615"),
    ("mid3_615", "mid2_615"),
    ("mid2_615", "mid1_615"),
    ("mid1_615", "cross_n_615"),

    # Column x = 650 (Packaged Outer)
    ("cross_s_650", "mid3_650"),
    ("mid3_650", "mid2_650"),
    ("mid2_650", "mid1_650"),
    ("mid1_650", "cross_n_650"),

    # North Cross Aisle (y = 170) horizontal chain
    ("cross_n_100", "cross_n_145"),
    ("cross_n_145", "cross_n_250"),
    ("cross_n_250", "cross_n_365"),
    ("cross_n_365", "cross_n_505"),
    ("cross_n_505", "cross_n_615"),
    ("cross_n_615", "cross_n_650"),

    # North Cross Aisle (170) to Back Concourse (120) vertical links
    ("cross_n_100", "back_100"),
    ("cross_n_145", "back_165"),
    ("cross_n_250", "back_250"),
    ("cross_n_365", "back_365"),
    ("cross_n_505", "back_505"),
    ("cross_n_615", "back_615"),
    ("cross_n_650", "back_650"),

    # Back Concourse (y = 120) horizontal chain
    ("back_100", "back_165"),
    ("back_165", "back_250"),
    ("back_250", "back_295"),
    ("back_295", "back_365"),
    ("back_365", "back_485"),
    ("back_485", "back_505"),
    ("back_505", "back_615"),
    ("back_615", "back_650"),
]


# ---------------------------------------------------------
# 4. Products Catalog Data (70+ items)
# ---------------------------------------------------------
PRODUCTS_DATA = [
    # --- Category: Fruits & Vegetables ---
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_seasonal_fruits",
        "name": "Fresh Ratnagiri Alphonso Mangoes",
        "brand": "Farm Fresh",
        "description": "Handpicked naturally ripened Alphonso mangoes with rich aroma and sweet pulp.",
        "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg (4-5 pcs)",
        "price": 349.0,
        "original_price": 399.0,
        "discount_pct": 12,
        "stock": 45,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_seasonal_fruits",
        "name": "Mahabaleshwar Fresh Strawberries",
        "brand": "Farm Fresh",
        "description": "Sweet, juicy ruby-red strawberries packed in protective punnet.",
        "image_url": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 g pack",
        "price": 119.0,
        "original_price": 140.0,
        "discount_pct": 15,
        "stock": 30,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_citrus_apples",
        "name": "Washington Royal Gala Red Apples",
        "brand": "Fresh Harvest",
        "description": "Crisp and delightfully sweet imported Royal Gala apples.",
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "4 pcs (~650g)",
        "price": 165.0,
        "original_price": 195.0,
        "discount_pct": 15,
        "stock": 50,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_citrus_apples",
        "name": "Nagpur Fresh Mandarin Oranges",
        "brand": "Farm Fresh",
        "description": "Easy to peel, juicy citrus oranges loaded with natural Vitamin C.",
        "image_url": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg (~6 pcs)",
        "price": 89.0,
        "original_price": 110.0,
        "discount_pct": 19,
        "stock": 40,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_citrus_apples",
        "name": "Zespri Green Kiwi",
        "brand": "Zespri",
        "description": "Tangy and refreshing nutrient-dense kiwifruit.",
        "image_url": "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "3 pcs pack",
        "price": 99.0,
        "original_price": 120.0,
        "discount_pct": 17,
        "stock": 35,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_bananas_melons",
        "name": "Organic Robusta Bananas",
        "brand": "Farm Fresh",
        "description": "Naturally grown sweet Robusta bananas, rich in potassium and energy.",
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg (~6-8 pcs)",
        "price": 48.0,
        "original_price": 60.0,
        "discount_pct": 20,
        "stock": 80,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_bananas_melons",
        "name": "Sweet Kiran Striped Watermelon",
        "brand": "Farm Fresh",
        "description": "Crisp and thirst-quenching sweet whole watermelon.",
        "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 pc (~2.5 kg)",
        "price": 85.0,
        "original_price": 105.0,
        "discount_pct": 19,
        "stock": 25,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_bananas_melons",
        "name": "Fresh Ripe Taiwan Papaya",
        "brand": "Farm Fresh",
        "description": "Sweet orange flesh papaya, high in digestive enzymes and vitamins.",
        "image_url": "https://images.unsplash.com/photo-1617112848923-cc2234396a8d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 pc (~1 kg)",
        "price": 55.0,
        "original_price": 70.0,
        "discount_pct": 21,
        "stock": 30,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_root_veg",
        "name": "Farm Fresh Red Nashik Onions",
        "brand": "Farm Fresh",
        "description": "Pungent and flavorful grade-A red onions for everyday cooking.",
        "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg bag",
        "price": 35.0,
        "original_price": 45.0,
        "discount_pct": 22,
        "stock": 150,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_root_veg",
        "name": "Fresh New Crop Jyoti Potatoes",
        "brand": "Farm Fresh",
        "description": "Versatile all-purpose potatoes perfect for frying, curries and mash.",
        "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg bag",
        "price": 28.0,
        "original_price": 35.0,
        "discount_pct": 20,
        "stock": 140,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_root_veg",
        "name": "Fresh Crunchy Red Carrots",
        "brand": "Farm Fresh",
        "description": "Naturally sweet farm-harvested red carrots, ideal for salads and halwa.",
        "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g pack",
        "price": 32.0,
        "original_price": 40.0,
        "discount_pct": 20,
        "stock": 60,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_daily_veg",
        "name": "Fresh Hybrid Salad Tomatoes",
        "brand": "Farm Fresh",
        "description": "Firm and juicy vine-ripened tomatoes for daily cooking and salads.",
        "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg pack",
        "price": 29.0,
        "original_price": 38.0,
        "discount_pct": 23,
        "stock": 120,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_daily_veg",
        "name": "Crisp Green Bell Capsicum",
        "brand": "Farm Fresh",
        "description": "Crunchy thick-walled green capsicum, great for stir fries and curries.",
        "image_url": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g pack",
        "price": 42.0,
        "original_price": 50.0,
        "discount_pct": 16,
        "stock": 50,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_daily_veg",
        "name": "English Seedless Cucumber",
        "brand": "Farm Fresh",
        "description": "Hydrating, crisp green cucumber with tender skin and mild flavor.",
        "image_url": "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g pack",
        "price": 34.0,
        "original_price": 42.0,
        "discount_pct": 19,
        "stock": 45,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_leafy_herbs",
        "name": "Fresh Fragrant Coriander (Dhaniya)",
        "brand": "Farm Fresh",
        "description": "Crisp green aromatic coriander leaves for authentic Indian garnishing.",
        "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "100 g bunch",
        "price": 15.0,
        "original_price": 20.0,
        "discount_pct": 25,
        "stock": 70,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_leafy_herbs",
        "name": "Spicy Indian Green Chillies",
        "brand": "Farm Fresh",
        "description": "Fresh vibrant green chillies with a sharp, fiery kick.",
        "image_url": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "100 g pack",
        "price": 12.0,
        "original_price": 15.0,
        "discount_pct": 20,
        "stock": 90,
    },
    {
        "category_slug": "fruits-vegetables",
        "shelf_key": "sh_leafy_herbs",
        "name": "Tender Baby Spinach (Palak)",
        "brand": "Farm Fresh",
        "description": "Washed and sorted tender spinach leaves rich in iron and folates.",
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "250 g bunch",
        "price": 24.0,
        "original_price": 30.0,
        "discount_pct": 20,
        "stock": 40,
    },

    # --- Category: Dairy, Bread & Eggs ---
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_milk_paneer",
        "name": "Amul Taaza Homogenised Toned Milk",
        "brand": "Amul",
        "description": "Pasteurized and homogenised fresh toned milk, 3.0% fat, 8.5% SNF.",
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Pouch",
        "price": 56.0,
        "original_price": 56.0,
        "discount_pct": 0,
        "stock": 100,
    },
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_milk_paneer",
        "name": "Amul Malai Fresh Cottage Cheese (Paneer)",
        "brand": "Amul",
        "description": "Soft and creamy fresh cottage cheese made from pasteurized milk.",
        "image_url": "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 g pack",
        "price": 92.0,
        "original_price": 95.0,
        "discount_pct": 3,
        "stock": 60,
    },
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_milk_paneer",
        "name": "Mother Dairy Classic Thick Dahi",
        "brand": "Mother Dairy",
        "description": "Traditional thick set curd with live probiotic goodness.",
        "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "400 g cup",
        "price": 35.0,
        "original_price": 35.0,
        "discount_pct": 0,
        "stock": 80,
    },
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_butter_eggs",
        "name": "Amul Pasteurized Salted Butter",
        "brand": "Amul",
        "description": "Utterly butterly delicious creamy table butter.",
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g block",
        "price": 275.0,
        "original_price": 285.0,
        "discount_pct": 3,
        "stock": 70,
    },
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_butter_eggs",
        "name": "Britannia 100% Whole Wheat Brown Bread",
        "brand": "Britannia",
        "description": "Freshly baked whole wheat bread with high dietary fiber.",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "400 g loaf",
        "price": 50.0,
        "original_price": 55.0,
        "discount_pct": 9,
        "stock": 65,
    },
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_butter_eggs",
        "name": "Farm Fresh Grade-A White Eggs",
        "brand": "Farm Fresh",
        "description": "Nutritious protein-rich fresh farm eggs, sanitized and carefully boxed.",
        "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "Pack of 12",
        "price": 98.0,
        "original_price": 115.0,
        "discount_pct": 14,
        "stock": 90,
    },
    {
        "category_slug": "dairy-bread-eggs",
        "shelf_key": "sh_butter_eggs",
        "name": "Amul Processed Cheese Cubes",
        "brand": "Amul",
        "description": "Individual foil wrapped delicious processed cheese cubes.",
        "image_url": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 g (8 cubes)",
        "price": 135.0,
        "original_price": 145.0,
        "discount_pct": 6,
        "stock": 45,
    },

    # --- Category: Atta, Rice, Oil & Dals ---
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_atta_flours",
        "name": "Aashirvaad Shudh 100% Whole Wheat Chakki Atta",
        "brand": "Aashirvaad",
        "description": "Superior 4-step chakki milled whole wheat flour for extra soft rotis.",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "5 kg bag",
        "price": 245.0,
        "original_price": 285.0,
        "discount_pct": 14,
        "stock": 60,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_atta_flours",
        "name": "Fortune Besan Gram Flour",
        "brand": "Fortune",
        "description": "100% chana dal fine ground besan for crispy pakoras and sweets.",
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg pack",
        "price": 95.0,
        "original_price": 110.0,
        "discount_pct": 13,
        "stock": 40,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_rice_basmati",
        "name": "Fortune Rozana Premium Basmati Rice",
        "brand": "Fortune",
        "description": "Aromatic long grain basmati rice suitable for daily pulao and biryani.",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "5 kg bag",
        "price": 385.0,
        "original_price": 460.0,
        "discount_pct": 16,
        "stock": 50,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_rice_basmati",
        "name": "Fortune Everyday Sona Masoori Raw Rice",
        "brand": "Fortune",
        "description": "Light, fluffy and easy to digest premium aged Sona Masoori rice.",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "5 kg bag",
        "price": 340.0,
        "original_price": 390.0,
        "discount_pct": 12,
        "stock": 45,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_dals_pulses",
        "name": "Tata Sampann Unpolished Toor Dal",
        "brand": "Tata Sampann",
        "description": "Unpolished toor dal that retains natural goodness and authentic taste.",
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg pack",
        "price": 175.0,
        "original_price": 199.0,
        "discount_pct": 12,
        "stock": 70,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_dals_pulses",
        "name": "Tata Sampann Yellow Moong Dal Dhuli",
        "brand": "Tata Sampann",
        "description": "Quick cooking unpolished yellow split moong dal, rich in protein.",
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg pack",
        "price": 155.0,
        "original_price": 175.0,
        "discount_pct": 11,
        "stock": 60,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_dals_pulses",
        "name": "Tata Sampann Premium Kabuli Chana",
        "brand": "Tata Sampann",
        "description": "Jumbo size white chickpeas, delicious for North Indian chhole.",
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g pack",
        "price": 95.0,
        "original_price": 110.0,
        "discount_pct": 13,
        "stock": 55,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_cooking_oils",
        "name": "Fortune Sunlite Refined Sunflower Oil",
        "brand": "Fortune",
        "description": "Light, healthy cooking oil enriched with Vitamins A & D.",
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Pouch",
        "price": 135.0,
        "original_price": 160.0,
        "discount_pct": 15,
        "stock": 80,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_cooking_oils",
        "name": "Dhara Kachi Ghani Pure Mustard Oil",
        "brand": "Dhara",
        "description": "Cold pressed pure mustard oil with strong authentic aroma and pungency.",
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Bottle",
        "price": 152.0,
        "original_price": 175.0,
        "discount_pct": 13,
        "stock": 60,
    },
    {
        "category_slug": "atta-rice-oil-dals",
        "shelf_key": "sh_cooking_oils",
        "name": "Amul Pure Cow Ghee Carton",
        "brand": "Amul",
        "description": "Granular golden cow ghee with rich traditional taste and wellness aroma.",
        "image_url": "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Carton",
        "price": 620.0,
        "original_price": 675.0,
        "discount_pct": 8,
        "stock": 40,
    },

    # --- Category: Masala & Spices ---
    {
        "category_slug": "masala-spices",
        "shelf_key": "sh_spices_masala",
        "name": "Everest Pure Turmeric Powder (Haldi)",
        "brand": "Everest",
        "description": "High curcumin bright yellow turmeric powder for vibrant color and aroma.",
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 g pack",
        "price": 62.0,
        "original_price": 72.0,
        "discount_pct": 13,
        "stock": 85,
    },
    {
        "category_slug": "masala-spices",
        "shelf_key": "sh_spices_masala",
        "name": "Everest Kashmiri Lal Mirch Powder",
        "brand": "Everest",
        "description": "Mild heat, deep fiery red color spice powder for restaurant-style gravies.",
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "100 g pack",
        "price": 78.0,
        "original_price": 90.0,
        "discount_pct": 13,
        "stock": 90,
    },
    {
        "category_slug": "masala-spices",
        "shelf_key": "sh_spices_masala",
        "name": "Everest Coriander Powder (Dhaniya)",
        "brand": "Everest",
        "description": "Ground from fresh aromatic coriander seeds for wholesome Indian dishes.",
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 g pack",
        "price": 68.0,
        "original_price": 78.0,
        "discount_pct": 12,
        "stock": 70,
    },
    {
        "category_slug": "masala-spices",
        "shelf_key": "sh_spices_masala",
        "name": "MDH Chunky Chat Masala",
        "brand": "MDH",
        "description": "Tangy zesty spice blend for fruit salads, snacks, and chaats.",
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "100 g box",
        "price": 74.0,
        "original_price": 85.0,
        "discount_pct": 12,
        "stock": 65,
    },
    {
        "category_slug": "masala-spices",
        "shelf_key": "sh_spices_masala",
        "name": "Tata Salt Vacuum Evaporated Iodised",
        "brand": "Tata",
        "description": "Desh Ka Namak — pure vacuum evaporated iodised cooking salt.",
        "image_url": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg pack",
        "price": 28.0,
        "original_price": 30.0,
        "discount_pct": 6,
        "stock": 150,
    },
    {
        "category_slug": "masala-spices",
        "shelf_key": "sh_spices_masala",
        "name": "Catch Pure Black Pepper Sprinkler",
        "brand": "Catch",
        "description": "Finely ground bold black peppercorns in a table shaker dispenser.",
        "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "50 g sprinkler",
        "price": 85.0,
        "original_price": 99.0,
        "discount_pct": 14,
        "stock": 50,
    },

    # --- Category: Snacks & Munchies ---
    {
        "category_slug": "snacks-munchies",
        "shelf_key": "sh_chips_namkeen",
        "name": "Lay's India's Magic Masala Potato Chips",
        "brand": "Lay's",
        "description": "Ridged crunchy potato chips tossed in spicy Indian magic masalas.",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "50 g pouch",
        "price": 20.0,
        "original_price": 20.0,
        "discount_pct": 0,
        "stock": 120,
    },
    {
        "category_slug": "snacks-munchies",
        "shelf_key": "sh_chips_namkeen",
        "name": "Kurkure Masala Munch Crispy Snack",
        "brand": "Kurkure",
        "description": "Crispy puffed corn puffs flavored with bold spices and chatpata zest.",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "85 g pouch",
        "price": 20.0,
        "original_price": 20.0,
        "discount_pct": 0,
        "stock": 110,
    },
    {
        "category_slug": "snacks-munchies",
        "shelf_key": "sh_chips_namkeen",
        "name": "Haldiram's Nagpur Crisp Aloo Bhujia",
        "brand": "Haldiram's",
        "description": "Minty, spicy potato and gram flour crisp strings for tea-time.",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 g pack",
        "price": 58.0,
        "original_price": 65.0,
        "discount_pct": 10,
        "stock": 75,
    },
    {
        "category_slug": "snacks-munchies",
        "shelf_key": "sh_chips_namkeen",
        "name": "Doritos Sweet Chilli Tortilla Nachos",
        "brand": "Doritos",
        "description": "Bold triangle corn chips with sweet and spicy Mexican seasoning.",
        "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "75 g pouch",
        "price": 35.0,
        "original_price": 40.0,
        "discount_pct": 12,
        "stock": 60,
    },
    {
        "category_slug": "snacks-munchies",
        "shelf_key": "sh_chips_namkeen",
        "name": "Act II Instant Golden Popcorn Butter Delite",
        "brand": "Act II",
        "description": "Hot and fresh microwave or pressure cooker theater-style butter popcorn.",
        "image_url": "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "150 g pack",
        "price": 45.0,
        "original_price": 50.0,
        "discount_pct": 10,
        "stock": 50,
    },

    # --- Category: Bakery & Biscuits ---
    {
        "category_slug": "bakery-biscuits",
        "shelf_key": "sh_biscuits_cookies",
        "name": "Britannia Good Day Butter Cookies",
        "brand": "Britannia",
        "description": "Rich buttery cookies topped with smiling ridges and delightful crunch.",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "600 g Party Pack",
        "price": 115.0,
        "original_price": 140.0,
        "discount_pct": 17,
        "stock": 60,
    },
    {
        "category_slug": "bakery-biscuits",
        "shelf_key": "sh_biscuits_cookies",
        "name": "Parle-G Gold Glucose Biscuits",
        "brand": "Parle",
        "description": "India's beloved teatime biscuit, packed with milk and wheat nourishment.",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg Mega Pack",
        "price": 110.0,
        "original_price": 120.0,
        "discount_pct": 8,
        "stock": 90,
    },
    {
        "category_slug": "bakery-biscuits",
        "shelf_key": "sh_biscuits_cookies",
        "name": "Oreo Original Vanilla Creme Cookies",
        "brand": "Cadbury Oreo",
        "description": "Crunchy rich chocolate wafer cookies with a sweet vanilla creme center.",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "300 g Family Pack",
        "price": 85.0,
        "original_price": 100.0,
        "discount_pct": 15,
        "stock": 75,
    },
    {
        "category_slug": "bakery-biscuits",
        "shelf_key": "sh_biscuits_cookies",
        "name": "Sunfeast Dark Fantasy Choco Fills",
        "brand": "Sunfeast",
        "description": "Crisp baked cookie shell with a molten chocolate lava heart.",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "300 g Box",
        "price": 130.0,
        "original_price": 160.0,
        "discount_pct": 18,
        "stock": 50,
    },
    {
        "category_slug": "bakery-biscuits",
        "shelf_key": "sh_biscuits_cookies",
        "name": "Britannia Little Hearts Sweet & Salty",
        "brand": "Britannia",
        "description": "Sugar-glazed cute heart-shaped puff biscuits that melt in your mouth.",
        "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "75 g pack",
        "price": 25.0,
        "original_price": 25.0,
        "discount_pct": 0,
        "stock": 70,
    },

    # --- Category: Cold Drinks & Juices ---
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_cold_drinks",
        "name": "Coca-Cola Original Taste Soft Drink",
        "brand": "Coca-Cola",
        "description": "The world's favorite sparkling cola drink, crisp and refreshing.",
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "750 ml Bottle",
        "price": 40.0,
        "original_price": 40.0,
        "discount_pct": 0,
        "stock": 100,
    },
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_cold_drinks",
        "name": "Thums Up Charged Carbonated Beverage",
        "brand": "Thums Up",
        "description": "Bold, fizzy and strong cola drink with a spicy punch of taste.",
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "750 ml Bottle",
        "price": 40.0,
        "original_price": 40.0,
        "discount_pct": 0,
        "stock": 90,
    },
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_cold_drinks",
        "name": "Real Fruit Power Mixed Fruit Juice",
        "brand": "Real",
        "description": "9 nutrient-rich fruits blended into wholesome delicious natural juice.",
        "image_url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Tetrapack",
        "price": 115.0,
        "original_price": 130.0,
        "discount_pct": 11,
        "stock": 60,
    },
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_cold_drinks",
        "name": "Red Bull Energy Drink Can",
        "brand": "Red Bull",
        "description": "Wiiings when you need them — revitalizes body and mind with caffeine & B-vitamins.",
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "250 ml Can",
        "price": 120.0,
        "original_price": 125.0,
        "discount_pct": 4,
        "stock": 50,
    },
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_tea_coffee_water",
        "name": "Bisleri Packaged Drinking Mineral Water",
        "brand": "Bisleri",
        "description": "10-step purified natural mineral water with added minerals.",
        "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Bottle",
        "price": 20.0,
        "original_price": 20.0,
        "discount_pct": 0,
        "stock": 180,
    },
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_tea_coffee_water",
        "name": "Tata Tea Gold Rich Taste & Aroma",
        "brand": "Tata Tea",
        "description": "Fine blend of gently rolled Assam leaves with long aroma teas.",
        "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g pack",
        "price": 280.0,
        "original_price": 320.0,
        "discount_pct": 12,
        "stock": 60,
    },
    {
        "category_slug": "cold-drinks-juices",
        "shelf_key": "sh_tea_coffee_water",
        "name": "Nescafé Classic 100% Pure Instant Coffee",
        "brand": "Nescafé",
        "description": "Medium-dark roasted pure Robusta beans for bold flavor and morning awakening.",
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "100 g Glass Jar",
        "price": 310.0,
        "original_price": 345.0,
        "discount_pct": 10,
        "stock": 45,
    },

    # --- Category: Instant Food & Noodles ---
    {
        "category_slug": "instant-food-noodles",
        "shelf_key": "sh_instant_noodles",
        "name": "Maggi 2-Minute Masala Instant Noodles",
        "brand": "Maggi",
        "description": "India's favorite instant noodles with the iconic blend of roasted spices.",
        "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "840 g (Pack of 12)",
        "price": 168.0,
        "original_price": 180.0,
        "discount_pct": 7,
        "stock": 110,
    },
    {
        "category_slug": "instant-food-noodles",
        "shelf_key": "sh_instant_noodles",
        "name": "Sunfeast Yippee! Mood Masala Noodles",
        "brand": "Sunfeast",
        "description": "Non-sticky round noodles with 2 spice sachets to match your spice mood.",
        "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "280 g (Pack of 4)",
        "price": 55.0,
        "original_price": 60.0,
        "discount_pct": 8,
        "stock": 70,
    },
    {
        "category_slug": "instant-food-noodles",
        "shelf_key": "sh_instant_noodles",
        "name": "Kellogg's Corn Flakes Original",
        "brand": "Kellogg's",
        "description": "Crisp golden sun-ripened corn flakes loaded with 8 essential vitamins.",
        "image_url": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "475 g Box",
        "price": 185.0,
        "original_price": 210.0,
        "discount_pct": 11,
        "stock": 45,
    },
    {
        "category_slug": "instant-food-noodles",
        "shelf_key": "sh_instant_noodles",
        "name": "Quaker 100% Wholegrain Rolled Oats",
        "brand": "Quaker",
        "description": "Heart healthy wholegrain quick cooking oats, rich in beta-glucan fiber.",
        "image_url": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 kg Pouch",
        "price": 190.0,
        "original_price": 215.0,
        "discount_pct": 11,
        "stock": 50,
    },

    # --- Category: Personal Care ---
    {
        "category_slug": "personal-care",
        "shelf_key": "sh_oral_soaps",
        "name": "Colgate Strong Teeth Dental Cream Toothpaste",
        "brand": "Colgate",
        "description": "Amino Shakti formula that provides 2x strengthening of tooth enamel.",
        "image_url": "https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 g Saver Pack",
        "price": 175.0,
        "original_price": 199.0,
        "discount_pct": 12,
        "stock": 70,
    },
    {
        "category_slug": "personal-care",
        "shelf_key": "sh_oral_soaps",
        "name": "Dettol Original Germ Protection Bathing Soap",
        "brand": "Dettol",
        "description": "Trusted antiseptic pine fragrance bar soap providing 99.9% germ defense.",
        "image_url": "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "Pack of 4 x 125g",
        "price": 195.0,
        "original_price": 230.0,
        "discount_pct": 15,
        "stock": 80,
    },
    {
        "category_slug": "personal-care",
        "shelf_key": "sh_hair_skin",
        "name": "Head & Shoulders Cool Menthol Anti-Dandruff Shampoo",
        "brand": "Head & Shoulders",
        "description": "Cooling menthol formula leaves hair up to 100% dandruff free with fresh feel.",
        "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "340 ml Bottle",
        "price": 285.0,
        "original_price": 340.0,
        "discount_pct": 16,
        "stock": 55,
    },
    {
        "category_slug": "personal-care",
        "shelf_key": "sh_hair_skin",
        "name": "Nivea Soft Light Non-Greasy Moisturising Cream",
        "brand": "Nivea",
        "description": "Fast absorbing everyday face, hand and body moisturizer with Jojoba oil.",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "200 ml Tub",
        "price": 240.0,
        "original_price": 299.0,
        "discount_pct": 19,
        "stock": 50,
    },
    {
        "category_slug": "personal-care",
        "shelf_key": "sh_hair_skin",
        "name": "Dove Deep Moisture Nourishing Body Wash",
        "brand": "Dove",
        "description": "Sulfate-free microbiome gentle body wash for instantly soft, smooth skin.",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "400 ml Bottle",
        "price": 275.0,
        "original_price": 325.0,
        "discount_pct": 15,
        "stock": 45,
    },

    # --- Category: Cleaning & Household ---
    {
        "category_slug": "cleaning-household",
        "shelf_key": "sh_laundry",
        "name": "Surf Excel Matic Front Load Liquid Detergent",
        "brand": "Surf Excel",
        "description": "Penetrates deep into fabric fibers to remove tough stains in washing machines.",
        "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "2 L Bottle",
        "price": 399.0,
        "original_price": 450.0,
        "discount_pct": 11,
        "stock": 65,
    },
    {
        "category_slug": "cleaning-household",
        "shelf_key": "sh_laundry",
        "name": "Ariel Matic 3-in-1 Top Load Detergent Powder",
        "brand": "Ariel",
        "description": "Brightens whites and colors while providing deep stain removal in 1 wash.",
        "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "2 kg Bag",
        "price": 360.0,
        "original_price": 410.0,
        "discount_pct": 12,
        "stock": 50,
    },
    {
        "category_slug": "cleaning-household",
        "shelf_key": "sh_cleaners",
        "name": "Vim Lemon Dishwash Gel Bottle",
        "brand": "Vim",
        "description": "Concentrated lemon power cuts through stubborn burnt grease with 1 spoon.",
        "image_url": "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "750 ml Bottle",
        "price": 140.0,
        "original_price": 165.0,
        "discount_pct": 15,
        "stock": 90,
    },
    {
        "category_slug": "cleaning-household",
        "shelf_key": "sh_cleaners",
        "name": "Harpic Power Plus 10x Disinfectant Toilet Cleaner",
        "brand": "Harpic",
        "description": "Thick gel formula kills 99.9% germs and eliminates tough limescale stains.",
        "image_url": "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Bottle",
        "price": 185.0,
        "original_price": 210.0,
        "discount_pct": 11,
        "stock": 80,
    },
    {
        "category_slug": "cleaning-household",
        "shelf_key": "sh_cleaners",
        "name": "Lizol 3-in-1 Disinfectant Surface Cleaner Citrus",
        "brand": "Lizol",
        "description": "Provides 10x better germ protection than standard phenyls with lasting freshness.",
        "image_url": "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "1 L Bottle",
        "price": 199.0,
        "original_price": 225.0,
        "discount_pct": 11,
        "stock": 70,
    },
    {
        "category_slug": "cleaning-household",
        "shelf_key": "sh_cleaners",
        "name": "Colin Glass and Multi-Surface Cleaner Spray",
        "brand": "Colin",
        "description": "Shine booster formula delivers sparkling streak-free glass, car and mirror surfaces.",
        "image_url": "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=600&q=80",
        "quantity_label": "500 ml Spray",
        "price": 98.0,
        "original_price": 115.0,
        "discount_pct": 14,
        "stock": 85,
    },
]


async def seed_all():
    """Idempotently seed the SwiftMart database."""
    print("🚀 Initializing SwiftMart Database Seed...")

    # Drop and recreate all tables for a clean idempotent start
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created.")

    async with AsyncSessionLocal() as db:
        # 1. Seed Demo Users
        admin_user = User(
            email="admin@swiftmart.com",
            hashed_password=get_password_hash("admin123"),
            full_name="SwiftMart Admin",
            phone="9876543210",
            is_active=True,
            is_admin=True,
        )
        customer_user = User(
            email="user@swiftmart.com",
            hashed_password=get_password_hash("user123"),
            full_name="Alex Johnson",
            phone="9123456789",
            is_active=True,
            is_admin=False,
        )
        db.add_all([admin_user, customer_user])
        await db.flush()

        # Add carts and address for demo users
        db.add(Cart(user_id=admin_user.id))
        db.add(Cart(user_id=customer_user.id))
        db.add(Address(
            user_id=customer_user.id,
            label="Home",
            line1="Flat 402, Green Glen Layout, Outer Ring Road",
            city="Bengaluru",
            state="Karnataka",
            pincode="560103",
            is_default=True,
        ))
        await db.flush()
        print("✅ Demo users (admin & customer) seeded.")

        # 2. Seed Categories
        category_map = {}  # slug -> Category instance
        for cat_data in CATEGORIES_DATA:
            category = Category(**cat_data)
            db.add(category)
            category_map[cat_data["slug"]] = category
        await db.flush()
        print(f"✅ {len(category_map)} Categories seeded.")

        # 3. Seed Supermarket Layout (Sections, Aisles, Shelves)
        shelf_map = {}  # key -> Shelf instance
        for sec_data in SECTIONS_DATA:
            section = StoreSection(
                name=sec_data["name"],
                color=sec_data["color"],
                x=sec_data["x"],
                y=sec_data["y"],
                width=sec_data["width"],
                height=sec_data["height"],
            )
            db.add(section)
            await db.flush()

            for aisle_data in sec_data["aisles"]:
                aisle = Aisle(
                    section_id=section.id,
                    name=aisle_data["name"],
                    aisle_number=aisle_data["aisle_number"],
                )
                db.add(aisle)
                await db.flush()

                for sh_data in aisle_data["shelves"]:
                    shelf = Shelf(
                        aisle_id=aisle.id,
                        name=sh_data["name"],
                        x=sh_data["x"],
                        y=sh_data["y"],
                        width=sh_data["width"],
                        height=sh_data["height"],
                    )
                    db.add(shelf)
                    shelf_map[sh_data["key"]] = shelf

        await db.flush()
        print(f"✅ Layout seeded: {len(SECTIONS_DATA)} Sections, Aisles, and {len(shelf_map)} Shelves.")

        # 4. Seed Walkable Graph (Nodes & Edges)
        node_map = {}  # key -> WalkableNode instance
        for n_data in NODES_DATA:
            node = WalkableNode(
                x=n_data["x"],
                y=n_data["y"],
                label=n_data["label"],
            )
            db.add(node)
            node_map[n_data["key"]] = node

        await db.flush()

        edge_count = 0
        for from_key, to_key in EDGES_PAIRS:
            n1 = node_map[from_key]
            n2 = node_map[to_key]
            dist = round(math.hypot(n1.x - n2.x, n1.y - n2.y), 2)
            edge = WalkableEdge(
                from_node_id=n1.id,
                to_node_id=n2.id,
                weight=dist,
            )
            db.add(edge)
            edge_count += 1

        await db.flush()
        print(f"✅ Walkable Graph seeded: {len(node_map)} Nodes, {edge_count} Edges.")

        # 5. Seed Products
        for p_data in PRODUCTS_DATA:
            shelf = shelf_map[p_data["shelf_key"]]
            category = category_map[p_data["category_slug"]]

            # Exact shelf center coordinates
            shelf_center_x = round(shelf.x + (shelf.width / 2.0), 1)
            shelf_center_y = round(shelf.y + (shelf.height / 2.0), 1)

            product = Product(
                name=p_data["name"],
                brand=p_data["brand"],
                category_id=category.id,
                description=p_data["description"],
                image_url=p_data["image_url"],
                quantity_label=p_data["quantity_label"],
                price=p_data["price"],
                original_price=p_data["original_price"],
                discount_pct=p_data["discount_pct"],
                stock=p_data["stock"],
                is_available=True,
                shelf_id=shelf.id,
                shelf_x=shelf_center_x,
                shelf_y=shelf_center_y,
            )
            db.add(product)

        await db.commit()
        print(f"✅ {len(PRODUCTS_DATA)} Products seeded successfully.")

    print("🎉 SwiftMart Database Seeding Complete!")


if __name__ == "__main__":
    asyncio.run(seed_all())
