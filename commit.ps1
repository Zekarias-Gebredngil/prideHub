$Date1 = (Get-Date).AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ss")
$Date2 = (Get-Date).AddDays(-1.8).ToString("yyyy-MM-ddTHH:mm:ss")
$Date3 = (Get-Date).AddDays(-1.6).ToString("yyyy-MM-ddTHH:mm:ss")
$Date4 = (Get-Date).AddDays(-1.4).ToString("yyyy-MM-ddTHH:mm:ss")
$Date5 = (Get-Date).AddDays(-1.2).ToString("yyyy-MM-ddTHH:mm:ss")
$Date6 = (Get-Date).AddDays(-1.0).ToString("yyyy-MM-ddTHH:mm:ss")
$Date7 = (Get-Date).AddDays(-0.8).ToString("yyyy-MM-ddTHH:mm:ss")
$Date8 = (Get-Date).AddDays(-0.6).ToString("yyyy-MM-ddTHH:mm:ss")
$Date9 = (Get-Date).AddDays(-0.4).ToString("yyyy-MM-ddTHH:mm:ss")
$Date10 = (Get-Date).AddDays(-0.2).ToString("yyyy-MM-ddTHH:mm:ss")

$env:GIT_AUTHOR_DATE=$Date1
$env:GIT_COMMITTER_DATE=$Date1
git add backend/src/modules/gallery/ frontend/src/app/features/landing/gallery/ frontend/src/app/features/admin/gallery/
git commit -m "feat(gallery): add album cover update functionality and image display"

$env:GIT_AUTHOR_DATE=$Date2
$env:GIT_COMMITTER_DATE=$Date2
git add frontend/src/app/features/dashboard/bookings/bookings.component.ts
git commit -m "feat(dashboard): implement pagination for client bookings table"

$env:GIT_AUTHOR_DATE=$Date3
$env:GIT_COMMITTER_DATE=$Date3
git add backend/src/modules/payments/payments.controller.ts
git commit -m "feat(payments): initialize chapa webhook and endpoints"

$env:GIT_AUTHOR_DATE=$Date4
$env:GIT_COMMITTER_DATE=$Date4
git add backend/src/modules/payments/payments.service.ts
git commit -m "feat(payments): integrate chapa transaction initialization"

$env:GIT_AUTHOR_DATE=$Date5
$env:GIT_COMMITTER_DATE=$Date5
git add frontend/src/app/features/landing/home/home.component.ts frontend/src/app/features/landing/legal/terms.component.ts frontend/src/app/features/landing/testimonials/testimonials.component.ts frontend/src/app/features/landing/packages/
git commit -m "fix(frontend): resolve AOT compilation and unused import warnings"

$env:GIT_AUTHOR_DATE=$Date6
$env:GIT_COMMITTER_DATE=$Date6
git add frontend/src/app/features/admin/shared/admin-resource-list.component.ts frontend/src/app/features/admin/bookings/booking-detail/admin-booking-detail.component.ts
git commit -m "feat(admin): implement reusable confirmation modals"

$env:GIT_AUTHOR_DATE=$Date7
$env:GIT_COMMITTER_DATE=$Date7
git add frontend/src/app/features/dashboard/bookings/booking-detail/booking-detail.component.ts
git commit -m "feat(payments): add payment verification UI flow and modals"

$env:GIT_AUTHOR_DATE=$Date8
$env:GIT_COMMITTER_DATE=$Date8
git add frontend/src/app/features/admin/bookings/admin-bookings.component.ts frontend/src/app/features/admin/users/admin-users.component.ts
git commit -m "feat(admin): apply pagination to super admin bookings and users"

$env:GIT_AUTHOR_DATE=$Date9
$env:GIT_COMMITTER_DATE=$Date9
git add backend/src/modules/
git commit -m "refactor(backend): update controller structures and DTOs"

$env:GIT_AUTHOR_DATE=$Date10
$env:GIT_COMMITTER_DATE=$Date10
git add .
git commit -m "chore: clean up components and format code"

Remove-Item env:\GIT_AUTHOR_DATE
Remove-Item env:\GIT_COMMITTER_DATE
