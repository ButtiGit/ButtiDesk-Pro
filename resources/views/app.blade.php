<!DOCTYPE html>
<html lang="it" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex, nofollow">
        <meta name="theme-color" content="#0b0d10">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <script>
            try { document.documentElement.classList.toggle('dark', localStorage.getItem('desk.theme') !== 'light'); } catch (_) {}
        </script>
        @viteReactRefresh
        @vite('resources/js/app.tsx')
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
