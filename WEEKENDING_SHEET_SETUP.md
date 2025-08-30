# Weekending Sheet Setup Guide

## Overview
The Weekending Sheet is a new tab in your Wendy's dashboard that allows managers to track weekly operational data, sales metrics, and training information. This feature provides a comprehensive view of weekly performance and helps maintain operational excellence.

## Features

### 📊 Data Entry
- **Basic Information**: Week ending date, manager name, and optional notes
- **Sales & Financial Data**: Breakfast sales, late night sales, net sales, discounts, cash, food totals, labor costs, and variance tracking
- **WeLearn & Training**: Onboarding status, food safety quiz scores, new hires, and terminations

### 📱 Mobile-First Design
- Responsive layout that works on all screen sizes
- Collapsible WeLearn section for mobile optimization
- Touch-friendly form inputs and buttons

### 🔄 Data Management
- Create, edit, and delete weekly entries
- Export data to CSV format
- Automatic date calculation for current week ending
- Data validation and error handling

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the required table:

```bash
# Copy the SQL content from weekending-sheet-setup.sql
# Execute it in your Supabase SQL editor or database
```

### 2. Navigation
The Weekending Sheet tab has been automatically added to your sidebar navigation. It appears between "Omega Daily" and "Calendar" with high priority.

### 3. Store Linking
Ensure your user account is linked to a store through the Setup tab before using this feature.

## Usage

### Adding a New Entry
1. Click "Add Weekending Entry" button
2. Fill in the required fields:
   - **Week Ending Date**: Automatically set to current Saturday
   - **Manager Name**: Select from Scott, Sophear, Letoya, or Carissa
   - **Sales Data**: Enter financial metrics
   - **WeLearn Section**: Toggle to expand and fill training information
3. Click "Save Entry"

### Editing an Entry
1. Click the edit (pencil) icon on any table row
2. Modify the data as needed
3. Click "Update Entry"

### Deleting an Entry
1. Click the delete (trash) icon on any table row
2. Confirm the deletion

### Exporting Data
1. Click "Export CSV" button when entries exist
2. Download the CSV file with all current data

## Field Descriptions

### Sales & Financial
- **Breakfast Sales (DP1)**: Morning shift sales
- **Late Night Sales (DP6)**: Evening/night shift sales
- **Net Sales**: Total sales for the week
- **Discounts**: Total discount amount given
- **Cash**: Cash transactions
- **Food Total**: Expected food revenue
- **Food Cost**: Actual food cost
- **Variance Dollars**: Difference between expected and actual
- **Food Variance %**: Percentage variance
- **Labor**: Total labor costs
- **Credit Hours**: Hours worked by staff

### WeLearn & Training
- **Onboarding**: Checkbox for completed onboarding
- **Crew Food Safety Quiz**: Score (0-100) for crew members
- **MGR Food Safety Quiz**: Score (0-100) for managers
- **New Hire Name**: Name of new employee (optional)
- **Terminations**: Notes about terminations (optional)
- **Term Date**: Date of termination (optional)

## Data Validation

The form includes comprehensive validation:
- Required fields must be filled
- Numeric fields must be positive
- Quiz scores must be between 0-100
- Dates must be valid
- Manager names must be from the predefined list

## Mobile Optimization

### Responsive Design
- Form fields stack vertically on small screens
- WeLearn section collapses by default on mobile
- Touch-friendly buttons and inputs
- Optimized table view with horizontal scrolling

### Mobile Breakpoints
- **≤480px**: Single column layout, collapsed sections
- **481px-768px**: Two column layout, expanded sections
- **>768px**: Full desktop layout

## Troubleshooting

### Common Issues

1. **"Store not connected" error**
   - Go to Setup tab and link your account to a store

2. **Form validation errors**
   - Check all required fields are filled
   - Ensure numeric values are positive
   - Verify quiz scores are within 0-100 range

3. **Data not saving**
   - Check internet connection
   - Verify store ID is properly linked
   - Check browser console for errors

### Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your store connection in Setup
3. Try refreshing the page
4. Contact your system administrator

## Data Security

- Row Level Security (RLS) ensures users only see data from their store
- All data is encrypted in transit and at rest
- User authentication required for all operations
- Audit trail maintained with created_at and updated_at timestamps

## Performance

- Optimized database queries with proper indexing
- Pagination for large datasets (100 entries per page)
- Efficient data caching with React Query
- Minimal re-renders with proper state management

## Future Enhancements

Potential improvements for future versions:
- Bulk data import from Excel files
- Advanced filtering and search
- Historical trend analysis
- Automated reporting
- Integration with other dashboard metrics
- Mobile app support
