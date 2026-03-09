// Vue 3 App with Vue Router
const { createApp, ref, onMounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// Define routes
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginComponent },
    { path: '/register/student', component: RegisterStudentComponent },
    { path: '/register/company', component: RegisterCompanyComponent },
    // Admin routes
    { path: '/admin/dashboard', component: AdminDashboardComponent, meta: { role: 'admin' } },
    { path: '/admin/companies', component: AdminCompaniesComponent, meta: { role: 'admin' } },
    { path: '/admin/students', component: AdminStudentsComponent, meta: { role: 'admin' } },
    { path: '/admin/drives', component: AdminDrivesComponent, meta: { role: 'admin' } },
    { path: '/admin/applications', component: AdminApplicationsComponent, meta: { role: 'admin' } },
    // Company routes
    { path: '/company/dashboard', component: CompanyDashboardComponent, meta: { role: 'company' } },
    { path: '/company/create-drive', component: CompanyCreateDriveComponent, meta: { role: 'company' } },
    { path: '/company/drives/:driveId/applications', component: CompanyApplicationsComponent, meta: { role: 'company' } },
    // Student routes
    { path: '/student/dashboard', component: StudentDashboardComponent, meta: { role: 'student' } },
    { path: '/student/drives', component: StudentDrivesComponent, meta: { role: 'student' } },
    { path: '/student/profile', component: StudentProfileComponent, meta: { role: 'student' } },
    { path: '/student/history', component: StudentHistoryComponent, meta: { role: 'student' } },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const publicPages = ['/login', '/register/student', '/register/company'];

    if (publicPages.includes(to.path)) {
        if (token && user) {
            // Already logged in, redirect to dashboard
            next('/' + user.role + '/dashboard');
        } else {
            next();
        }
        return;
    }

    if (!token) {
        next('/login');
        return;
    }

    // Check role
    if (to.meta.role && user && user.role !== to.meta.role) {
        next('/' + user.role + '/dashboard');
        return;
    }

    next();
});

// Create Vue app
const app = createApp({
    data() {
        return {
            currentUser: JSON.parse(localStorage.getItem('user') || 'null')
        };
    },
    methods: {
        handleLogin(user) {
            this.currentUser = user;
        },
        handleLogout() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            this.currentUser = null;
            this.$router.push('/login');
            showToast('Logged out successfully');
        }
    }
});

// Register components
app.component('navbar-component', NavbarComponent);

// Use router
app.use(router);

// Mount
app.mount('#app');
