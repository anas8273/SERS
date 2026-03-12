# Design Notes

## Current Issues
- Homepage looks decent but icons in "الخدمات التفاعلية الجاهزة" section use emoji instead of proper icons
- Stats cards at bottom have icons overlapping with numbers
- Need to improve the PerformanceEvidence page design
- Need to connect saveReport to backend API instead of localStorage
- Need to improve AI classification to analyze images, files, links deeply

## Completed
- Backend API (routers.ts, db.ts) - all CRUD operations
- SharedPortfolio page
- AdminDashboard page
- App.tsx routes updated
- Database schema and migrations

## Remaining Work
1. Fix PerformanceEvidence saveReport to use tRPC instead of localStorage
2. Improve AI classification to upload files to S3 first then analyze
3. Write tests
4. Create skill
