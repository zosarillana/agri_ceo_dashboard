# Graph Report - D:\\Projects\\agri\_ceo\_dashboard  (2026-06-02)

## Corpus Check
- 147 files · ~61,286 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 682 nodes · 1721 edges · 138 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 568 non-file, non-concept node(s)
- Weakly connected components: 174
- Singleton components: 170
- Isolated nodes: 170
- Largest component: 381 node(s) (67% of the entity graph basis)
- Low-cohesion communities: 3
- Largest low-cohesion community: 60 node(s) (cohesion 0.09)

## Workspace Bridges
1. `Card\(\)` - connects `Components Dialog`, `Components Landing Dashboard`, `Components Select`, `Routes Accounts Input Form`, `Routes Energy`, `Routes Maintenance — Refresh`, `Routes Maintenance Form`, `Routes Maintenance Log Form`, `Routes Profile`, `Routes Settings`, `Routes Table`, `Routes Trading Input Form — Product`; home: `Routes Ceodashboard`; degree 59; score 14533.32
  source files: `D:/Projects/agri\_ceo\_dashboard/src/components/landing/landing-dashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/card.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/accounts-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/energy-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/maintenance-log-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/maintenance.form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/product-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/production-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/qc-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/sales-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/trading-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/workforce-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/profile.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/settings.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/users.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/accounts.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/energy.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/maintenance.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/procurement.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/production.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/qc.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/sales.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/trading.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/workforce.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/ceodashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/userdashboard.tsx`
2. `Button\(\)` - connects `Components Dialog`, `Components Landing Dashboard`, `Components Landing Navbar`, `Components Mode Toggle`, `Components Nav Bar`, `Components Select`, `Routes Accounts Input Form`, `Routes Header`, `Routes Settings`, `Routes Trading Input Form — Product`, `Routes Userdashboard — Active`; home: `Routes Table`; degree 32; score 15666.29
  source files: `D:/Projects/agri\_ceo\_dashboard/src/components/authentication/sign-in.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/landing/landing-dashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/theme/mode-toggle.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/button.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/calendar.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/date-picker.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/dialog.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/accounts-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/energy-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/product-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/production-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/qc-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/sales-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/trading-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/workforce-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/settings.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/users.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/accounts.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/maintenance.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/production.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/qc.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/sales.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/trading.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/workforce.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/ceodashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/userdashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/admin/-header.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/user/-header.tsx`
3. `CardContent\(\)` - connects `Components Dialog`, `Components Landing Dashboard`, `Components Select`, `Routes Accounts Input Form`, `Routes Energy`, `Routes Profile`, `Routes Settings`, `Routes Table`, `Routes Trading Input Form — Product`; home: `Routes Ceodashboard`; degree 55; score 11056.3
  source files: `D:/Projects/agri\_ceo\_dashboard/src/components/landing/landing-dashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/card.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/accounts-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/energy-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/product-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/production-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/qc-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/sales-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/trading-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/workforce-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/profile.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/settings.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/users.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/accounts.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/energy.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/procurement.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/production.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/qc.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/sales.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/trading.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-submodules/workforce.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/ceodashboard.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/userdashboard.tsx`
4. `TradingInputForm\(\)` - connects `Components Select`, `Routes Ceodashboard`, `Routes Table`, `Routes Trading Input Form`, `Routes Trading Input Form — Blur`, `Routes Trading Input Form — Date`, `Routes Trading Input Form — Date \(2\)`, `Routes Trading Input Form — Empty`, `Routes Trading Input Form — Rows`; home: `Routes Trading Input Form — Product`; degree 30; score 9351.4
  source files: `D:/Projects/agri\_ceo\_dashboard/src/components/ui/badge.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/button.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/calendar.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/card.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/input.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/label.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/popover.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/accounts-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/trading-input-form.tsx`
5. `GlobalNavbar\(\)` - connects `Components Avatar`, `Components Dropdown Menu`, `Components Landing Navbar`, `Components Navigation Menu`, `Components Navigation Menu — Menu`, `Routes Admin`, `Routes Settings`, `Routes Table`, `Routes User`; home: `Components Nav Bar`; degree 24; score 7797.02
  source files: `D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/avatar.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/button.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/dropdown-menu.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/navigation-menu.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-profile/settings.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/admin.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/user.tsx`
6. `SalesInputForm\(\)` - connects `Components Select`, `Routes Ceodashboard`, `Routes Sales Input Form`, `Routes Sales Input Form — Blur`, `Routes Sales Input Form — Date`, `Routes Sales Input Form — Date \(2\)`, `Routes Sales Input Form — Empty`, `Routes Sales Input Form — Rows`; home: `Routes Table`; degree 29; score 8410.75
  source files: `D:/Projects/agri\_ceo\_dashboard/src/components/ui/badge.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/button.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/calendar.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/card.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/input.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/label.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/components/ui/popover.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/accounts-input-form.tsx`, `D:/Projects/agri\_ceo\_dashboard/src/routes/auth/-components/-forms/sales-input-form.tsx`

## God Nodes
1. `Card\(\)` - 60 edges
2. `CardContent\(\)` - 56 edges
3. `AccountInputForm\(\)` - 36 edges
4. `Users\(\)` - 36 edges
5. `WorkforceInputForm\(\)` - 35 edges
6. `QCInputForm\(\)` - 34 edges
7. `Button\(\)` - 33 edges
8. `TradingInputForm\(\)` - 32 edges
9. `CardHeader\(\)` - 31 edges
10. `EnergyInputForm\(\)` - 31 edges

## Surprising Connections
- `GlobalNavbar\(\)` --renders--> `NavigationMenuList\(\)`  [EXTRACTED]
  D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx → D:/Projects/agri\_ceo\_dashboard/src/components/ui/navigation-menu.tsx  _bridges separate communities; peripheral node \`NavigationMenuList\(\)\` unexpectedly reaches hub \`GlobalNavbar\(\)\`_
- `GlobalNavbar\(\)` --renders--> `NavigationMenuItem\(\)`  [EXTRACTED]
  D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx → D:/Projects/agri\_ceo\_dashboard/src/components/ui/navigation-menu.tsx  _bridges separate communities; peripheral node \`NavigationMenuItem\(\)\` unexpectedly reaches hub \`GlobalNavbar\(\)\`_
- `GlobalNavbar\(\)` --renders--> `NavigationMenuLink\(\)`  [EXTRACTED]
  D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx → D:/Projects/agri\_ceo\_dashboard/src/components/ui/navigation-menu.tsx  _bridges separate communities; peripheral node \`NavigationMenuLink\(\)\` unexpectedly reaches hub \`GlobalNavbar\(\)\`_
- `GlobalNavbar\(\)` --renders--> `DropdownMenu\(\)`  [EXTRACTED]
  D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx → D:/Projects/agri\_ceo\_dashboard/src/components/ui/dropdown-menu.tsx  _bridges separate communities; peripheral node \`DropdownMenu\(\)\` unexpectedly reaches hub \`GlobalNavbar\(\)\`_
- `GlobalNavbar\(\)` --renders--> `DropdownMenuTrigger\(\)`  [EXTRACTED]
  D:/Projects/agri\_ceo\_dashboard/src/components/global/nav-bar.tsx → D:/Projects/agri\_ceo\_dashboard/src/components/ui/dropdown-menu.tsx  _bridges separate communities; peripheral node \`DropdownMenuTrigger\(\)\` unexpectedly reaches hub \`GlobalNavbar\(\)\`_

## Semantic Anomalies
- **[HIGH] Bridge node** - Button\(\) bridges Routes Table and Components Dialog, Components Landing Navbar, Components Nav Bar, Components Landing Dashboard, Components Mode Toggle, Components Button, Routes Accounts Input Form, Components Select, Routes Trading Input Form — Product, Routes Settings, Routes Userdashboard — Active, Routes Header.
  _High betweenness centrality \(15524.290\) across 13 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - Card\(\) bridges Routes Ceodashboard and Components Landing Dashboard, Components Card, Routes Table, Routes Accounts Input Form, Routes Maintenance Log Form, Routes Maintenance Form, Components Select, Routes Trading Input Form — Product, Routes Profile, Routes Settings, Components Dialog, Routes Energy, Routes Maintenance — Refresh.
  _High betweenness centrality \(14354.320\) across 14 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - CardContent\(\) bridges Routes Ceodashboard and Components Landing Dashboard, Components Card, Routes Table, Routes Accounts Input Form, Components Select, Routes Trading Input Form — Product, Routes Profile, Routes Settings, Components Dialog, Routes Energy.
  _High betweenness centrality \(10911.298\) across 11 communities makes this node a likely dependency chokepoint._
- **[HIGH] Low-cohesion community** - Routes Table is weakly connected for its size.
  _Cohesion score 0.09 across 60 nodes suggests this community may mix unrelated responsibilities._
- **[HIGH] Low-cohesion community** - Routes Ceodashboard is weakly connected for its size.
  _Cohesion score 0.09 across 58 nodes suggests this community may mix unrelated responsibilities._

## Communities

### Community 0 - "Routes Table"
Cohesion (entity basis within full-graph community): 0.1
Nodes (65): AccountsDash\(\), handleClearFilter\(\), handleFilter\(\), AccountTable\(\), ErrorBanner\(\), InputSkeleton\(\), SuccessBanner\(\), ViewSkeleton\(\) (+57 more)

### Community 1 - "Routes Ceodashboard"
Cohesion (entity basis within full-graph community): 0.16
Nodes (42): Card\(\), CardContent\(\), CardHeader\(\), DashCard\(\), EnergyCard\(\), fmtMonthLabel\(\), MaintenanceCard\(\), QcCard\(\) (+34 more)

### Community 2 - "Components Landing Dashboard"
Cohesion (entity basis within full-graph community): 0.15
Nodes (27): CEODashboard\(\), isActive\(\), AccountsExpanded\(\), CardHeaderBlock\(\), currentMonthKey\(\), dateToISO\(\), EnergyCard\(\), fmt\(\) (+19 more)

### Community 3 - "Components Dialog"
Cohesion (entity basis within full-graph community): 0.13
Nodes (17): Dialog\(\), DialogClose\(\), DialogContent\(\), DialogDescription\(\), DialogFooter\(\), DialogHeader\(\), DialogOverlay\(\), DialogPortal\(\) (+9 more)

### Community 4 - "Components Select"
Cohesion (entity basis within full-graph community): 0.19
Nodes (17): Label\(\), LogInput\(\), handleSubmit\(\), EditRowInline\(\), handleChange\(\), handleSave\(\), ProductInputForm\(\), addRow\(\) (+9 more)

### Community 5 - "Routes Ceodashboard — Card"
Cohesion (entity basis within full-graph community): 0.01
Nodes (14): AnimatedCard\(\), CardHeader\(\), CardTimestamp\(\), ExpandRow\(\), fmt\(\), fmtDate\(\), fmtUSD\(\), HistoricalBadge\(\) (+6 more)

### Community 6 - "Routes Accounts Input Form"
Cohesion (entity basis within full-graph community): 0.27
Nodes (13): AccountInputForm\(\), addRow\(\), applyRows\(\), fetchForDate\(\), handleDateChange\(\), handleReset\(\), handleSave\(\), relockRow\(\) (+5 more)

### Community 7 - "Src Route Tree Gen"
Cohesion (entity basis within full-graph community): 0
Nodes (12): AuthAdminLayoutDashboardRouteChildren, AuthAdminLayoutRouteChildren, AuthAdminRouteChildren, AuthUserLayoutDashboardRouteChildren, AuthUserLayoutRouteChildren, AuthUserRouteChildren, FileRoutesByFullPath, FileRoutesById (+4 more)

### Community 8 - "Routes Mock Data"
Cohesion (entity basis within full-graph community): 0
Nodes (11): AccountItem, EnergyAccount, EnergyData, MaintenanceUnit, ProcurementItem, ProductionData, ProductionLine, QCData (+3 more)

### Community 9 - "Routes Energy"
Cohesion (entity basis within full-graph community): 0.14
Nodes (9): EnergyDash\(\), handleSaved\(\), EnergyView\(\), load\(\), fmt\(\), fmtPHP\(\), formatMonth\(\), MonthlyRow (+1 more)

### Community 10 - "Routes Sales Input Form"
Cohesion (entity basis within full-graph community): 0
Nodes (8): dateToISO\(\), ErrorBanner\(\), fmtUSD\(\), getTodayISO\(\), Product, SaleRow, SalesInputFormProps, SuccessBanner\(\)

### Community 11 - "Routes Trading Input Form"
Cohesion (entity basis within full-graph community): 0
Nodes (8): dateToISO\(\), ErrorBanner\(\), fmtUSD\(\), getTodayISO\(\), Product, SuccessBanner\(\), TradeRow, TradingInputFormProps

### Community 12 - "Routes Workforce Input Form"
Cohesion (entity basis within full-graph community): 0
Nodes (8): dateToISO\(\), DeptRow, ErrorBanner\(\), getTodayISO\(\), rateBadgeVariant\(\), Section, SuccessBanner\(\), WorkforceInputFormProps

### Community 13 - "Services Accounts Service"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): AccountService, .delete\(\), .getAll\(\), .getSummary\(\), .markPaid\(\), .store\(\), .update\(\)

### Community 14 - "Routes Header"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): AdminHeader\(\), UserHeader\(\), AdminLayout\(\), UserLayout\(\), Separator\(\)

### Community 15 - "Routes Qc Input Form"
Cohesion (entity basis within full-graph community): 0
Nodes (7): ErrorBanner\(\), getRowStats\(\), getTodayISO\(\), passRateBadgeVariant\(\), QCInputFormProps, QCRow, SuccessBanner\(\)

### Community 16 - "Routes Userdashboard"
Cohesion (entity basis within full-graph community): 0
Nodes (7): AnimatedCard\(\), CardHeader\(\), CardTimestamp\(\), ExpandRow\(\), fmtPHP\(\), fmtUSD\(\), StatusPill\(\)

### Community 17 - "Routes Workforce"
Cohesion (entity basis within full-graph community): 0.07
Nodes (6): fmt\(\), getTodayISO\(\), isoToDate\(\), rateBadgeVariant\(\), RouteComponent\(\), handleClear\(\)

### Community 18 - "Services Adminuser Service"
Cohesion (entity basis within full-graph community): 0
Nodes (6): adminDeleteUser\(\), adminUpdateUser\(\), AdminUpdateUserPayload, AdminUser, AdminUserDepartment, getUsers\(\)

### Community 19 - "Components Button"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 20 - "Components Tabs"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DashboardLayout\(\), Tabs\(\), TabsList\(\), TabsTrigger\(\)

### Community 21 - "Types Dashboard Types"
Cohesion (entity basis within full-graph community): 0
Nodes (6): QcDailyTrend, QcProductPerformance, QcStats, QcWeeklyBreakdown, WorkforceDeptStat, WorkforceStats

### Community 22 - "Services Department Service"
Cohesion (entity basis within full-graph community): 0
Nodes (6): createDepartment\(\), deleteDepartment\(\), getDepartment\(\), getDepartments\(\), getDepartmentUsers\(\), updateDepartment\(\)

### Community 23 - "Components Dropdown Menu"
Cohesion (entity basis within full-graph community): 0
Nodes (6): DropdownMenu\(\), DropdownMenuContent\(\), DropdownMenuItem\(\), DropdownMenuLabel\(\), DropdownMenuSeparator\(\), DropdownMenuTrigger\(\)

### Community 24 - "Components Nav Bar"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): GlobalNavbar\(\), getInitials\(\), handleNavigate\(\), handleScrollToSection\(\), handleSignOut\(\), isDashboardNavItem\(\), isLandingNavItem\(\)

### Community 25 - "Routes Production"
Cohesion (entity basis within full-graph community): 0
Nodes (4): dateToISO\(\), fmt\(\), getTodayISO\(\), RouteComponent\(\)

### Community 26 - "Routes Trading Input Form — Product"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): TradingInputForm\(\), handleFocus\(\), relockProduct\(\), setCounterparty\(\), setMarket\(\), setNumeric\(\), unlockProduct\(\)

### Community 27 - "Services Trading Service"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): TradingService, .deleteTrade\(\), .getLatest\(\), .getSummary\(\), .storeBulk\(\), .updateTrade\(\)

### Community 28 - "Routes Energy Input Form"
Cohesion (entity basis within full-graph community): 0
Nodes (5): ErrorBanner\(\), getTodayMonth\(\), InputRow, Props, SuccessBanner\(\)

### Community 29 - "Routes Maintenance"
Cohesion (entity basis within full-graph community): 0
Nodes (2): RouteComponent\(\), ViewSkeleton\(\)

### Community 30 - "Routes Maintenance Log Form"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): cn\(\), LogsSkeleton\(\), MaintenanceLogForm\(\), fetchLogs\(\)

### Community 31 - "Routes Sales"
Cohesion (entity basis within full-graph community): 0
Nodes (4): fmt\(\), fmtUSD\(\), RouteComponent\(\), SaleRow

### Community 32 - "Routes Trading"
Cohesion (entity basis within full-graph community): 0
Nodes (5): fmt\(\), fmtNumber\(\), fmtUSD\(\), getMarketBadge\(\), RouteComponent\(\)

### Community 33 - "Routes Userdashboard — Active"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): fmtDate\(\), getAllowedTiles\(\), getTodayISO\(\), relativeTime\(\), UserDashboard\(\), isActive\(\)

### Community 34 - "Routes Accounts Input Form — Account"
Cohesion (entity basis within full-graph community): 0
Nodes (4): AccountInputFormProps, AccountRow, dateToISO\(\), fmtPHP\(\)

### Community 35 - "Services Auth Service"
Cohesion (entity basis within full-graph community): 0
Nodes (4): getUser\(\), login\(\), logout\(\), registerUser\(\)

### Community 36 - "Routes Procurement"
Cohesion (entity basis within full-graph community): 0
Nodes (3): fmt\(\), procurementBadge\(\), RouteComponent\(\)

### Community 37 - "Components Chart"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): ChartLegendContent\(\), ChartTooltipContent\(\), getPayloadConfigFromPayload\(\), useChart\(\)

### Community 38 - "Types Department Types"
Cohesion (entity basis within full-graph community): 0
Nodes (4): CreateDepartmentPayload, Department, DepartmentUser, UpdateDepartmentPayload

### Community 39 - "Routes Landing Footer"
Cohesion (entity basis within full-graph community): 0.33
Nodes (3): LandingPage\(\), RouteComponent\(\), LandingFooter\(\)

### Community 40 - "Components Theme Provider"
Cohesion (entity basis within full-graph community): 0
Nodes (3): Register, ThemeProvider\(\), useTheme\(\)

### Community 41 - "Routes Production Form"
Cohesion (entity basis within full-graph community): 0
Nodes (4): dateToISO\(\), ErrorBanner\(\), getTodayISO\(\), SuccessBanner\(\)

### Community 42 - "Routes Qc"
Cohesion (entity basis within full-graph community): 0
Nodes (3): fmt\(\), isoToDate\(\), RouteComponent\(\)

### Community 43 - "Routes Accounts"
Cohesion (entity basis within full-graph community): 0
Nodes (3): accountBadge\(\), fmtPHP\(\), RouteComponent\(\)

### Community 44 - "Routes Accounts Input Form — Amount"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): handleAmountBlur\(\), formatDisplayValue\(\), fromApi\(\), uid\(\)

### Community 45 - "Routes Accounts Input Form — Amount \(2\)"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): handleAmountFocus\(\), setAmount\(\), unlockRow\(\), updateRow\(\)

### Community 46 - "Types Accounts Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): Account, AccountPayload, AccountSummary

### Community 47 - "Components Avatar"
Cohesion (entity basis within full-graph community): 0
Nodes (3): Avatar\(\), AvatarFallback\(\), AvatarImage\(\)

### Community 48 - "Types Energy Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): EnergyPayload, EnergyRecord, EnergySummary

### Community 49 - "Components Landing Navbar"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): LandingNavbar\(\), handleLogoClick\(\), handleSignInClick\(\), ModeToggle\(\)

### Community 50 - "Routes Maintenance — Card"
Cohesion (entity basis within full-graph community): 0.83
Nodes (4): formatDate\(\), statusBadge\(\), SubUnitCard\(\), UnitCard\(\)

### Community 51 - "Routes Maintenance — Refresh"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): MaintenanceDash\(\), refresh\(\), refreshLogs\(\), togglePlant\(\)

### Community 52 - "Components Navigation Menu"
Cohesion (entity basis within full-graph community): 0
Nodes (3): NavigationMenuItem\(\), NavigationMenuLink\(\), NavigationMenuList\(\)

### Community 53 - "Routes Product Form"
Cohesion (entity basis within full-graph community): 0
Nodes (3): EditDraft, ProductDraft, ProductInputFormProps

### Community 54 - "Routes Product Form — Handle"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): generateUUID\(\), newDraft\(\), handleReset\(\), handleSubmit\(\)

### Community 55 - "Routes Profile"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): getInitials\(\), getRoleBadgeColor\(\), Profile\(\)

### Community 56 - "Types Qc Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): QcPayload, QcRecord, QcSummary

### Community 57 - "Types Sales Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): Sale, SalePayload, SalesSummary

### Community 58 - "Routes Settings"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): getInitials\(\), Settings\(\), handlePasswordSave\(\), handleProfileSave\(\)

### Community 59 - "Types Trading Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): Trade, TradePayload, TradeSummary

### Community 60 - "Types Workforce Types"
Cohesion (entity basis within full-graph community): 0
Nodes (3): WorkforceRecord, WorkforceRowPayload, WorkforceSummary

### Community 61 - "Store Accounts Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): AccountStore, DateRange

### Community 62 - "Components Card"
Cohesion (entity basis within full-graph community): 0
Nodes (2): CardAction\(\), CardFooter\(\)

### Community 63 - "Routes Ceodashboard — Key"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): currentMonthKey\(\), getTodayISO\(\), toMonthKey\(\)

### Community 64 - "Components Sign In"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SignInModalProps

### Community 65 - "Routes Settings — TSX"
Cohesion (entity basis within full-graph community): 1
Nodes (1): RouteComponent\(\)

### Community 66 - "Routes Maintenance — Date"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): handleDateSelect\(\), handleTimeChange\(\), formatDateTime\(\)

### Community 67 - "Routes Maintenance Form"
Cohesion (entity basis within full-graph community): 1
Nodes (2): MaintenanceForm\(\), toggleUnit\(\)

### Community 68 - "Routes Production Form — All"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): allSaved\(\), handleDateChange\(\), emptyForm\(\)

### Community 69 - "Routes Qc Input Form — Date"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): dateToISO\(\), fetchForDate\(\), handleDateChange\(\)

### Community 70 - "Routes Qc Input Form — Date \(2\)"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): isoToDate\(\), handleSubmit\(\), validate\(\)

### Community 71 - "Store Trading Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): DateRange, TradingStore

### Community 72 - "Types User Types"
Cohesion (entity basis within full-graph community): 0
Nodes (2): User, UserDepartment

### Community 73 - "Routes Users"
Cohesion (entity basis within full-graph community): 0
Nodes (2): deptNames\(\), RoleBadge\(\)

### Community 74 - "Routes Account"
Cohesion (entity basis within full-graph community): 1
Nodes (1): RouteComponent\(\)

### Community 75 - "Routes Admin"
Cohesion (entity basis within full-graph community): 1
Nodes (1): AdminLayout\(\)

### Community 76 - "Store Auth Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): AuthState

### Community 77 - "Routes Ceodashboard — Accounts"
Cohesion (entity basis within full-graph community): 1
Nodes (2): AccountsExpanded\(\), fmtPHP\(\)

### Community 78 - "Routes Ceodashboard — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleDateSelect\(\), toISO\(\)

### Community 79 - "Components Chart — Chart"
Cohesion (entity basis within full-graph community): 1
Nodes (2): ChartContainer\(\), ChartStyle\(\)

### Community 80 - "Components Checkbox"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Checkbox\(\)

### Community 81 - "Store Dashboard Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): getTodayISO\(\)

### Community 82 - "Store Department Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): DepartmentState

### Community 83 - "Routes Energy Input Form — Empty"
Cohesion (entity basis within full-graph community): 1
Nodes (2): emptyInputRows\(\), handleReset\(\)

### Community 84 - "Routes Energy Input Form — Blur"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleBlur\(\), formatDisplayValue\(\)

### Community 85 - "Routes Energy Input Form — Month"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleMonthSelect\(\), loadMonth\(\)

### Community 86 - "Routes Energy Input Form — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleSave\(\), isoToDate\(\)

### Community 87 - "Store Energy Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): EnergyState

### Community 88 - "Assets Landing Navbar"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 89 - "Components Mode Toggle"
Cohesion (entity basis within full-graph community): 1
Nodes (1): ModeToggle\(\)

### Community 90 - "Components Navigation Menu — Menu"
Cohesion (entity basis within full-graph community): 1
Nodes (2): NavigationMenu\(\), NavigationMenuViewport\(\)

### Community 91 - "Routes Production Form — Blur"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleBlur\(\), formatDisplayValue\(\)

### Community 92 - "Routes Production Form — Form"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleReset\(\), populateForm\(\)

### Community 93 - "Routes Production Form — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleSubmit\(\), isoToDate\(\)

### Community 94 - "Routes Qc — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): dateToISO\(\), handleDateChange\(\)

### Community 95 - "Routes Qc — Today"
Cohesion (entity basis within full-graph community): 1
Nodes (2): getTodayISO\(\), handleToday\(\)

### Community 96 - "Routes Qc Input Form — Empty"
Cohesion (entity basis within full-graph community): 1
Nodes (2): emptyRows\(\), handleReset\(\)

### Community 97 - "Routes Qc Input Form — Rows"
Cohesion (entity basis within full-graph community): 1
Nodes (2): populateRows\(\), applyRows\(\)

### Community 98 - "Store Qc Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): DateRange

### Community 99 - "Routes Root"
Cohesion (entity basis within full-graph community): 1
Nodes (1): RootComponent\(\)

### Community 100 - "Routes Sales Input Form — Empty"
Cohesion (entity basis within full-graph community): 1
Nodes (2): emptyRows\(\), handleReset\(\)

### Community 101 - "Routes Sales Input Form — Blur"
Cohesion (entity basis within full-graph community): 1
Nodes (2): formatDisplayValue\(\), handleBlur\(\)

### Community 102 - "Routes Sales Input Form — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): isoToDate\(\), handleSave\(\)

### Community 103 - "Routes Sales Input Form — Rows"
Cohesion (entity basis within full-graph community): 1
Nodes (2): populateRows\(\), applyRows\(\)

### Community 104 - "Routes Sales Input Form — Date \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchForDate\(\), handleDateChange\(\)

### Community 105 - "Store Sales Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): DateRange

### Community 106 - "Components Textarea"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Textarea\(\)

### Community 107 - "Routes Trading Input Form — Empty"
Cohesion (entity basis within full-graph community): 1
Nodes (2): emptyRows\(\), handleReset\(\)

### Community 108 - "Routes Trading Input Form — Blur"
Cohesion (entity basis within full-graph community): 1
Nodes (2): formatDisplayValue\(\), handleBlur\(\)

### Community 109 - "Routes Trading Input Form — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): isoToDate\(\), handleSave\(\)

### Community 110 - "Routes Trading Input Form — Rows"
Cohesion (entity basis within full-graph community): 1
Nodes (2): populateRows\(\), applyRows\(\)

### Community 111 - "Routes Trading Input Form — Date \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchForDate\(\), handleDateChange\(\)

### Community 112 - "Hooks Use Dashboard Channel"
Cohesion (entity basis within full-graph community): 1
Nodes (1): useDashboardChannel\(\)

### Community 113 - "Routes User"
Cohesion (entity basis within full-graph community): 1
Nodes (1): UserLayout\(\)

### Community 114 - "Services User Service"
Cohesion (entity basis within full-graph community): 1
Nodes (1): updateUser\(\)

### Community 115 - "Store User Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): UpdateUserPayload

### Community 116 - "Routes Userdashboard — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): toISO\(\), handleDateSelect\(\)

### Community 117 - "Routes Users — Department"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DepartmentPicker\(\), toggle\(\)

### Community 118 - "Routes Users — Fetch"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchUsers\(\), handleRegister\(\)

### Community 119 - "Assets Vite"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 120 - "Routes Workforce — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): dateToISO\(\), handleDateChange\(\)

### Community 121 - "Routes Workforce Input Form — Attendance"
Cohesion (entity basis within full-graph community): 1
Nodes (2): attendanceRate\(\), toNum\(\)

### Community 122 - "Routes Workforce Input Form — Build"
Cohesion (entity basis within full-graph community): 1
Nodes (2): buildEmptySections\(\), handleReset\(\)

### Community 123 - "Routes Workforce Input Form — Date"
Cohesion (entity basis within full-graph community): 1
Nodes (2): isoToDate\(\), handleSave\(\)

### Community 124 - "Routes Workforce Input Form — Sections"
Cohesion (entity basis within full-graph community): 1
Nodes (2): populateSections\(\), applySections\(\)

### Community 125 - "Routes Workforce Input Form — Date \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchForDate\(\), handleDateChange\(\)

### Community 126 - "Store Workforce Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): DateRange

### Community 127 - "Eslint Config Js"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 128 - "Favicon SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 129 - "Hero Png"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 130 - "Icons SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 131 - "Maintenance Types TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 132 - "Production Types TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 133 - "Products Service TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 134 - "Products Store TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 135 - "Products Types TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 136 - "Suminter Logo SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 137 - "Vite Env D TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **332 weakly connected node(s):** `SignInModalProps`, `handleSubmit\(\)`, `handleSignOut\(\)`, `handleNavigate\(\)`, `getInitials\(\)` (+327 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Routes Account`** (2 nodes): `account.tsx`, `RouteComponent\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Admin`** (2 nodes): `admin.tsx`, `AdminLayout\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Auth Store`** (2 nodes): `auth.store.ts`, `AuthState`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Ceodashboard — Accounts`** (2 nodes): `AccountsExpanded\(\)`, `fmtPHP\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Ceodashboard — Date`** (2 nodes): `handleDateSelect\(\)`, `toISO\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Chart — Chart`** (2 nodes): `ChartContainer\(\)`, `ChartStyle\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Checkbox`** (2 nodes): `checkbox.tsx`, `Checkbox\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Dashboard Store`** (2 nodes): `dashboard.store.ts`, `getTodayISO\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Department Store`** (2 nodes): `department.store.ts`, `DepartmentState`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Energy Input Form — Empty`** (2 nodes): `emptyInputRows\(\)`, `handleReset\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Energy Input Form — Blur`** (2 nodes): `handleBlur\(\)`, `formatDisplayValue\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Energy Input Form — Month`** (2 nodes): `handleMonthSelect\(\)`, `loadMonth\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Energy Input Form — Date`** (2 nodes): `handleSave\(\)`, `isoToDate\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Energy Store`** (2 nodes): `energy.store.ts`, `EnergyState`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Assets Landing Navbar`** (2 nodes): `landing-navbar.tsx`, `suminter-logo-nbg.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Mode Toggle`** (2 nodes): `mode-toggle.tsx`, `ModeToggle\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Navigation Menu — Menu`** (2 nodes): `NavigationMenu\(\)`, `NavigationMenuViewport\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Production Form — Blur`** (2 nodes): `handleBlur\(\)`, `formatDisplayValue\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Production Form — Form`** (2 nodes): `handleReset\(\)`, `populateForm\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Production Form — Date`** (2 nodes): `handleSubmit\(\)`, `isoToDate\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Qc — Date`** (2 nodes): `dateToISO\(\)`, `handleDateChange\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Qc — Today`** (2 nodes): `getTodayISO\(\)`, `handleToday\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Qc Input Form — Empty`** (2 nodes): `emptyRows\(\)`, `handleReset\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Qc Input Form — Rows`** (2 nodes): `populateRows\(\)`, `applyRows\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Qc Store`** (2 nodes): `qc.store.ts`, `DateRange`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Root`** (2 nodes): `\_\_root.tsx`, `RootComponent\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Sales Input Form — Empty`** (2 nodes): `emptyRows\(\)`, `handleReset\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Sales Input Form — Blur`** (2 nodes): `formatDisplayValue\(\)`, `handleBlur\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Sales Input Form — Date`** (2 nodes): `isoToDate\(\)`, `handleSave\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Sales Input Form — Rows`** (2 nodes): `populateRows\(\)`, `applyRows\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Sales Input Form — Date \(2\)`** (2 nodes): `fetchForDate\(\)`, `handleDateChange\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Sales Store`** (2 nodes): `sales.store.ts`, `DateRange`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Textarea`** (2 nodes): `textarea.tsx`, `Textarea\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Trading Input Form — Empty`** (2 nodes): `emptyRows\(\)`, `handleReset\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Trading Input Form — Blur`** (2 nodes): `formatDisplayValue\(\)`, `handleBlur\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Trading Input Form — Date`** (2 nodes): `isoToDate\(\)`, `handleSave\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Trading Input Form — Rows`** (2 nodes): `populateRows\(\)`, `applyRows\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Trading Input Form — Date \(2\)`** (2 nodes): `fetchForDate\(\)`, `handleDateChange\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hooks Use Dashboard Channel`** (2 nodes): `useDashboardChannel.js`, `useDashboardChannel\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes User`** (2 nodes): `user.tsx`, `UserLayout\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Services User Service`** (2 nodes): `user.service.ts`, `updateUser\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store User Store`** (2 nodes): `user.store.ts`, `UpdateUserPayload`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Userdashboard — Date`** (2 nodes): `toISO\(\)`, `handleDateSelect\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Users — Department`** (2 nodes): `DepartmentPicker\(\)`, `toggle\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Users — Fetch`** (2 nodes): `fetchUsers\(\)`, `handleRegister\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Assets Vite`** (2 nodes): `vite.svg`, `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Workforce — Date`** (2 nodes): `dateToISO\(\)`, `handleDateChange\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Workforce Input Form — Attendance`** (2 nodes): `attendanceRate\(\)`, `toNum\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Workforce Input Form — Build`** (2 nodes): `buildEmptySections\(\)`, `handleReset\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Workforce Input Form — Date`** (2 nodes): `isoToDate\(\)`, `handleSave\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Workforce Input Form — Sections`** (2 nodes): `populateSections\(\)`, `applySections\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Workforce Input Form — Date \(2\)`** (2 nodes): `fetchForDate\(\)`, `handleDateChange\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Store Workforce Store`** (2 nodes): `workforce.store.ts`, `DateRange`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Eslint Config Js`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Favicon SVG`** (1 nodes): `favicon.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero Png`** (1 nodes): `hero.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Icons SVG`** (1 nodes): `icons.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Maintenance Types TypeScript`** (1 nodes): `maintenance.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Production Types TypeScript`** (1 nodes): `production.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Products Service TypeScript`** (1 nodes): `products.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Products Store TypeScript`** (1 nodes): `products.store.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Products Types TypeScript`** (1 nodes): `products.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Suminter Logo SVG`** (1 nodes): `suminter-logo.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Env D TypeScript`** (1 nodes): `vite.env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does \`Button\(\)\` connect \`Routes Table\` to \`Components Dialog\`, \`Components Landing Navbar\`, \`Components Nav Bar\`, \`Components Landing Dashboard\`, \`Components Mode Toggle\`, \`Components Button\`, \`Routes Accounts Input Form\`, \`Components Select\`, \`Routes Trading Input Form — Product\`, \`Routes Settings\`, \`Routes Userdashboard — Active\`, \`Routes Header\`?**
  _High betweenness centrality \(15524.290\) - this node is a cross-community bridge._
- **Why does \`Card\(\)\` connect \`Routes Ceodashboard\` to \`Components Landing Dashboard\`, \`Components Card\`, \`Routes Table\`, \`Routes Accounts Input Form\`, \`Routes Maintenance Log Form\`, \`Routes Maintenance Form\`, \`Components Select\`, \`Routes Trading Input Form — Product\`, \`Routes Profile\`, \`Routes Settings\`, \`Components Dialog\`, \`Routes Energy\`, \`Routes Maintenance — Refresh\`?**
  _High betweenness centrality \(14354.320\) - this node is a cross-community bridge._
- **Why does \`CardContent\(\)\` connect \`Routes Ceodashboard\` to \`Components Landing Dashboard\`, \`Components Card\`, \`Routes Table\`, \`Routes Accounts Input Form\`, \`Components Select\`, \`Routes Trading Input Form — Product\`, \`Routes Profile\`, \`Routes Settings\`, \`Components Dialog\`, \`Routes Energy\`?**
  _High betweenness centrality \(10911.298\) - this node is a cross-community bridge._
- **What connects \`SignInModalProps\`, \`handleSubmit\(\)\`, \`handleSignOut\(\)\` to the rest of the system?**
  _332 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should \`Routes Table\` be split into smaller, more focused modules?**
  _Cohesion score 0.09 across 60 entity nodes - this community may mix unrelated responsibilities._
- **Should \`Routes Ceodashboard\` be split into smaller, more focused modules?**
  _Cohesion score 0.09 across 58 entity nodes - this community may mix unrelated responsibilities._
- **Should \`Components Nav Bar\` be split into smaller, more focused modules?**
  _Cohesion score 0.11 across 19 entity nodes - this community may mix unrelated responsibilities._
