# Theme Definition

## Color Palette

### Primary Colors
- **Primary**: `#2563eb` (Blue 600) - Main brand color for buttons and accents
- **Primary Hover**: `#1d4ed8` (Blue 700) - Hover state for primary elements
- **Primary Light**: `#dbeafe` (Blue 100) - Light backgrounds and subtle highlights

### Neutral Colors
- **Background**: `#ffffff` (White) - Main background
- **Surface**: `#f9fafb` (Gray 50) - Cards and elevated surfaces
- **Border**: `#e5e7eb` (Gray 300) - Borders and dividers
- **Text Primary**: `#111827` (Gray 900) - Main text color
- **Text Secondary**: `#6b7280` (Gray 500) - Secondary text and labels
- **Text Muted**: `#9ca3af` (Gray 400) - Disabled states and hints

### Semantic Colors
- **Success**: `#10b981` (Emerald 500) - Success states
- **Success Light**: `#d1fae5` (Emerald 100) - Success backgrounds
- **Error**: `#ef4444` (Red 500) - Error states
- **Error Light**: `#fee2e2` (Red 100) - Error backgrounds
- **Warning**: `#f59e0b` (Amber 500) - Warning states
- **Warning Light**: `#fef3c7` (Amber 100) - Warning backgrounds
- **Info**: `#3b82f6` (Blue 500) - Information states
- **Info Light**: `#dbeafe` (Blue 100) - Info backgrounds

## Typography

### Headings
- **H1**: `text-4xl font-bold` (36px, 700) - Page titles
- **H2**: `text-3xl font-semibold` (30px, 600) - Section headers
- **H3**: `text-2xl font-semibold` (24px, 600) - Subsection headers
- **H4**: `text-xl font-medium` (20px, 500) - Card titles
- **H5**: `text-lg font-medium` (18px, 500) - Small headers
- **H6**: `text-base font-medium` (16px, 500) - Labels

### Body Text
- **Regular**: `text-base` (16px) - Standard body text
- **Small**: `text-sm` (14px) - Secondary information
- **Extra Small**: `text-xs` (12px) - Captions and hints

## Components

### Cards
- Background: `bg-white`
- Border: `border border-gray-200`
- Shadow: `shadow-sm`
- Radius: `rounded-lg`
- Padding: `p-6`

### Buttons
- **Primary**: `bg-blue-600 hover:bg-blue-700 text-white`
- **Secondary**: `bg-gray-100 hover:bg-gray-200 text-gray-700`
- **Danger**: `bg-red-600 hover:bg-red-700 text-white`
- **Success**: `bg-emerald-600 hover:bg-emerald-700 text-white`
- Border Radius: `rounded-md`
- Padding: `px-4 py-2`

### Forms
- Input Background: `bg-white`
- Input Border: `border border-gray-300 focus:border-blue-500`
- Input Radius: `rounded-md`
- Label Color: `text-gray-700`
- Placeholder: `text-gray-400`

### Navigation
- Background: `bg-white`
- Border Bottom: `border-b border-gray-200`
- Active Link: `text-blue-600`
- Inactive Link: `text-gray-700 hover:text-gray-900`

## Layout

### Spacing
- **Container Max Width**: `max-w-7xl`
- **Section Padding**: `py-8 px-4 sm:px-6 lg:px-8`
- **Card Gap**: `gap-6`
- **Form Gap**: `space-y-4`

### Grid System
- **Desktop**: `grid-cols-12`
- **Tablet**: `sm:grid-cols-8`
- **Mobile**: `grid-cols-4`

## Images and Icons

### Image Processing Results
- **Container**: White background with subtle shadow
- **Border**: Light gray border (1px)
- **Aspect Ratio**: Maintain original aspect ratio
- **Max Height**: `max-h-96` (384px) for display
- **Object Fit**: `object-contain` to prevent distortion

### Upload Area
- **Background**: Dashed border with light gray
- **Hover State**: Blue border with light blue background
- **Icon**: Upload cloud icon in gray
- **Drag Active**: Blue border with blue icon

### Detection Overlays
- **Bounding Boxes**: Semi-transparent colored borders
- **Labels**: White background with slight transparency
- **Confidence Score**: Small text below label

### Icons
- **Size**: Default 24x24px (w-6 h-6)
- **Color**: Inherit from parent text color
- **Style**: Outline icons for UI elements
- **Loading**: Animated spinner with primary color

## Animations

### Transitions
- **Duration**: `transition-all duration-200`
- **Hover Effects**: Scale and shadow changes
- **Loading States**: Pulse animation for skeletons
- **Progress**: Smooth width transitions

### Loading States
- **Skeleton**: `bg-gray-200 animate-pulse`
- **Spinner**: Rotating border with primary color
- **Progress Bar**: Blue fill with smooth animation

## Dark Mode (Future Enhancement)
- **Background**: `#0f172a` (Slate 900)
- **Surface**: `#1e293b` (Slate 800)
- **Border**: `#334155` (Slate 700)
- **Text Primary**: `#f1f5f9` (Slate 100)
- **Text Secondary**: `#cbd5e1` (Slate 300)