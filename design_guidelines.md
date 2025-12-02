# Design Guidelines: Multi-Tenant Monitoring System

## Design Approach
**Reference-Based + System Hybrid**: Drawing primary inspiration from **Signoz**, with elements from Grafana and Datadog for monitoring-specific patterns. This is a utility-focused, information-dense application requiring clarity and efficiency over visual flair.

## Core Design Principles
1. **Data First**: Metrics and status information take visual priority
2. **Scan-ability**: Users should quickly identify health issues across multiple hosts
3. **Hierarchy**: Clear distinction between overview and detailed views
4. **Professional Elegance**: Clean, technical aesthetic that inspires confidence

## Typography System
- **Primary Font**: Inter or IBM Plex Sans via Google Fonts
- **Monospace**: JetBrains Mono for metrics, IDs, and version numbers
- **Hierarchy**:
  - Page titles: text-2xl font-semibold
  - Section headers: text-lg font-medium
  - Metrics/data: text-sm font-mono
  - Labels: text-xs uppercase tracking-wide
  - Body text: text-base

## Layout & Spacing System
**Tailwind spacing units**: Primarily use **2, 3, 4, 6, 8, 12, 16** for consistent rhythm

**Application Structure**:
- Fixed sidebar (w-64) for organization/client switching and main navigation
- Top bar (h-16) for breadcrumbs, search, and user menu
- Main content area with max-w-7xl container, px-6 py-8

## Component Library

### Navigation & Layout
- **Sidebar**: Fixed left navigation with org switcher at top, main nav items with icons, resource consumption indicator at bottom
- **Top Bar**: Breadcrumb trail, global search, real-time status indicator, user avatar with dropdown
- **Multi-tenant Switcher**: Dropdown at sidebar top showing current organization with quick-switch capability

### Dashboard Components
- **Host Cards Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
  - Card structure: Host name, status badge, key metrics preview (CPU/Memory/Disk as progress indicators), agent version, last seen timestamp
  - Status badges: pill-shaped with dot indicator (green=healthy, yellow=warning, red=critical, gray=offline)

- **Metrics Overview**: 
  - Small stat cards in grid-cols-4 layout showing: Total Hosts, Active Agents, Avg CPU Usage, Alerts
  - Large number (text-3xl font-bold) with label and trend indicator

- **Detailed Host View**:
  - Host header with name, status, tags, and action buttons
  - Tabbed interface: Overview | Metrics | Agent Details | Custom Fields | History
  - Time-series charts using recharts or similar (area charts for resource usage)
  - Chart container: h-64 to h-80 with proper padding

### Data Visualization
- **Resource Charts**: 
  - CPU, Memory, Disk, Network as separate cards or stacked view
  - Line/area charts with gradient fills
  - Time range selector (1h, 6h, 24h, 7d, 30d)
  - Y-axis labels, grid lines, tooltips on hover

- **Status Indicators**:
  - Health status: Large circular indicator or horizontal bar
  - Agent running: Animated pulse dot when active
  - Version badge: Monospace font with background

### Tables & Lists
- **Host List Table**:
  - Columns: Status, Hostname, Agent Version, CPU, Memory, Disk, Last Seen, Actions
  - Row hover states with subtle background
  - Sortable columns with arrow indicators
  - Filtering and search capabilities
  - Pagination footer

### Forms & Inputs
- **Search**: Prominent search bar (w-96) with icon and keyboard shortcut hint
- **Filters**: Multi-select dropdowns for status, client, tags
- **Custom Fields**: Dynamic form builder with field type selection

### Alerts & Notifications
- Toast notifications (top-right) for real-time alerts
- Alert banner at page top for critical system-wide issues
- In-app notification center icon with badge count

## Information Architecture

### Main Sections
1. **Dashboard** (Home): Overview of all hosts, key metrics, recent alerts
2. **Hosts**: Paginated list/grid view with filtering
3. **Host Detail**: Individual host deep-dive
4. **Agents**: Agent version management, deployment status
5. **Organizations**: Multi-tenant management (admin only)
6. **Roadmap**: Public-facing development timeline
7. **Settings**: Configuration, integrations, user preferences

## Roadmap Page Design
- Timeline visualization with cards for planned features
- Status indicators: Planned, In Progress, Completed
- Version milestones with release dates
- Community feedback integration area

## Responsive Behavior
- **Desktop (lg+)**: Full sidebar, multi-column grids, expanded charts
- **Tablet (md)**: Collapsible sidebar, 2-column grids, charts maintain height
- **Mobile**: Hidden sidebar with hamburger menu, single column, simplified charts (h-48), stacked metrics

## Interactive States
- **Loading**: Skeleton screens for tables and charts, pulse animations
- **Empty States**: Friendly illustrations with "Add Your First Host" CTAs
- **Error States**: Clear error messages with retry actions
- **Real-time Updates**: Subtle fade-in animations for new data, badge pulse for alerts

## Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation throughout
- Focus indicators on all interactive elements
- Color-blind safe status indicators (icons + colors)

## Performance Considerations
- Virtual scrolling for large host lists (1000+ hosts)
- Chart data aggregation for long time ranges
- Debounced search and filtering
- Optimistic UI updates for agent status changes

This design creates a professional, information-dense monitoring system that balances elegance with utility, ensuring users can quickly assess system health while diving deep into detailed metrics when needed.