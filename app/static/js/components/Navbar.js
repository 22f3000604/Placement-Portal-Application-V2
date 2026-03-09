const NavbarComponent = {
    props: ['user'],
    emits: ['logout'],
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-nav shadow-sm sticky-top">
        <div class="container">
            <a class="navbar-brand fw-bold d-flex align-items-center" href="#/">
                <i class="bi bi-mortarboard-fill me-2 fs-4"></i>
                <span>Placement Portal</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navMenu">
                <!-- Admin Nav -->
                <ul v-if="user && user.role === 'admin'" class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="#/admin/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/admin/companies"><i class="bi bi-building me-1"></i>Companies</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/admin/students"><i class="bi bi-people me-1"></i>Students</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/admin/drives"><i class="bi bi-briefcase me-1"></i>Drives</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/admin/applications"><i class="bi bi-file-earmark-text me-1"></i>Applications</a></li>
                </ul>
                <!-- Company Nav -->
                <ul v-if="user && user.role === 'company'" class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="#/company/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/company/create-drive"><i class="bi bi-plus-circle me-1"></i>New Drive</a></li>
                </ul>
                <!-- Student Nav -->
                <ul v-if="user && user.role === 'student'" class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="#/student/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/student/drives"><i class="bi bi-briefcase me-1"></i>Browse Drives</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/student/history"><i class="bi bi-clock-history me-1"></i>History</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/student/profile"><i class="bi bi-person me-1"></i>Profile</a></li>
                </ul>
                <!-- User Info & Logout -->
                <ul class="navbar-nav">
                    <li class="nav-item dropdown" v-if="user">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" data-bs-toggle="dropdown">
                            <div class="avatar-sm me-2">{{ user.email[0].toUpperCase() }}</div>
                            <span>{{ user.email }}</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow">
                            <li><span class="dropdown-item-text text-muted small">Role: {{ user.role }}</span></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" @click.prevent="$emit('logout')"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `
};
