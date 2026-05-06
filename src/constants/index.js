/**
 * ProGarden — Shared Constants
 * Static data lists used across multiple screens.
 */

// ─── Service Types (used in AddBuyer) ───────────────────────────────────────
export const SERVICE_TYPES = [
  // Top Priority (Most Used)
  'Artificial Vertical Garden', 'Natural Vertical Garden', 'Moss Wall', 'Balcony Garden',
  'Terrace Garden', 'Garden Maintenance', 'Plantation',
  // Landscape
  'Landscape Design', 'Landscape Installation', 'Landscape Renovation', 'Hardscape Work', 'Softscape Work',
  // Artificial Work
  'Artificial Grass', 'Artificial Plants', 'Artificial Green Wall', 'Synthetic Turf',
  // Gardening
  'Garden Development', 'Kitchen Garden', 'Rooftop Garden', 'Indoor Garden', 'Outdoor Garden',
  // Vertical & Green Walls
  'Green Wall', 'Living Wall', 'Bio Wall',
  // Plants & Nursery
  'Indoor Plants', 'Outdoor Plants', 'Plant Supply', 'Nursery Services', 'Plant Rental', 'Planter Box',
  // Irrigation & Water
  'Irrigation System', 'Drip Irrigation', 'Sprinkler System', 'Water Feature', 'Fountain Installation',
  // Wood & Construction
  'Wooden Deck', 'Pergola', 'Gazebo', 'WPC Decking', 'Wooden Fencing', 'Railing Work',
  // Hardscape & Paving
  'Paving & Pathway', 'Stone Cladding', 'Retaining Wall', 'Boundary Wall', 'Tile Work',
  // Maintenance
  'Annual Maintenance', 'Lawn Maintenance', 'Tree Trimming', 'Pest Control',
  // Consultation
  'Consultation', 'Site Visit', 'Design Consultation',
  // Other
  'Outdoor Lighting', 'Swimming Pool', 'Sports Turf', 'Waterproofing', 'Civil Work', 'Other',
];

// ─── Indian States ──────────────────────────────────────────────────────────
export const INDIAN_STATES = [
  'Delhi', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab',
  'Uttarakhand', 'Himachal Pradesh',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'West Bengal',
];

// ─── Form Dropdowns ─────────────────────────────────────────────────────────
export const GST_TREATMENTS = ['Registered Business', 'Unregistered', 'Consumer', 'SEZ'];
export const PROJECT_TYPES  = ['Installation', 'Renovation', 'Consultation', 'Annual Maintenance'];
export const ENVIRONMENTS   = ['Indoor', 'Outdoor', 'Semi-Outdoor'];
export const LEAD_SOURCES   = ['Google Search', 'Instagram / FB', 'Referral', 'Direct Call', 'Repeat Client', 'Other'];

// ─── Client Status Filter Tabs ──────────────────────────────────────────────
export const CLIENT_TABS = ['All', 'Active', 'Quoted', 'Converted', 'Inactive'];

// ─── Prefix Generators ──────────────────────────────────────────────────────
export const getQuotationPrefix = () =>
  `QTPG/${String(new Date().getMonth() + 1).padStart(2, '0')}`;

export const getInvoicePrefix = () =>
  `INVPG/${String(new Date().getMonth() + 1).padStart(2, '0')}`;
