const StudentDashboardComponent = {
    data() {
        return { dashboard: null, loading: true };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await API.get('/student/dashboard');
                this.dashboard = res.data;
            } catch (err) { showToast('Failed to load dashboard', 'error'); }
            finally { this.loading = false; }
        },
        statusBadge(s) {
            const m = { applied: 'bg-info', shortlisted: 'bg-warning text-dark', selected: 'bg-success', rejected: 'bg-danger' };
            return m[s] || 'bg-secondary';
        },
        formatDate(d) {
            return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        }
    },
    template: `
    <div class="container py-4">
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="dashboard">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="fw-bold mb-1"><i class="bi bi-person-circle me-2 text-primary"></i>Welcome, {{ dashboard.student.full_name }}</h2>
                    <p class="text-muted mb-0">{{ dashboard.student.branch }} — Year {{ dashboard.student.year }} — CGPA: {{ dashboard.student.cgpa }}</p>
                </div>
                <router-link to="/student/drives" class="btn btn-primary"><i class="bi bi-briefcase me-2"></i>Browse Drives</router-link>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card stat-card border-0 shadow-sm">
                        <div class="card-body d-flex align-items-center">
                            <div class="stat-icon bg-info-subtle text-info me-3"><i class="bi bi-briefcase-fill fs-4"></i></div>
                            <div><h3 class="fw-bold mb-0">{{ dashboard.approved_drives_count }}</h3><small class="text-muted">Open Drives</small></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stat-card border-0 shadow-sm">
                        <div class="card-body d-flex align-items-center">
                            <div class="stat-icon bg-primary-subtle text-primary me-3"><i class="bi bi-file-earmark-text-fill fs-4"></i></div>
                            <div><h3 class="fw-bold mb-0">{{ dashboard.total_applications }}</h3><small class="text-muted">My Applications</small></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stat-card border-0 shadow-sm">
                        <div class="card-body d-flex align-items-center">
                            <div class="stat-icon bg-success-subtle text-success me-3"><i class="bi bi-trophy-fill fs-4"></i></div>
                            <div><h3 class="fw-bold mb-0">{{ dashboard.total_selected }}</h3><small class="text-muted">Selections</small></div>
                        </div>
                    </div>
                </div>
            </div>

            <h5 class="fw-bold mb-3">Recent Applications</h5>
            <div v-if="dashboard.applications.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-inbox fs-1"></i>
                <p class="mt-2">No applications yet. <router-link to="/student/drives">Browse drives</router-link></p>
            </div>
            <div v-else class="card border-0 shadow-sm">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th>Company</th><th>Drive</th><th>Applied</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="a in dashboard.applications.slice(0, 10)" :key="a.id">
                                <td class="fw-semibold">{{ a.company_name }}</td>
                                <td>{{ a.drive_title }}</td>
                                <td>{{ formatDate(a.applied_at) }}</td>
                                <td><span class="badge rounded-pill" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="dashboard.applications.length > 10" class="card-footer text-center">
                    <router-link to="/student/history" class="text-decoration-none">View all applications →</router-link>
                </div>
            </div>
        </div>
    </div>
    `
};
