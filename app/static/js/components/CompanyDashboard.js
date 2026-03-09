const CompanyDashboardComponent = {
    data() {
        return { dashboard: null, loading: true };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await API.get('/company/dashboard');
                this.dashboard = res.data;
            } catch (err) { showToast('Failed to load dashboard', 'error'); }
            finally { this.loading = false; }
        },
        statusBadge(s) {
            return s === 'approved' ? 'bg-success' : s === 'pending' ? 'bg-warning text-dark' : s === 'closed' ? 'bg-secondary' : 'bg-danger';
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
                    <h2 class="fw-bold mb-1"><i class="bi bi-building me-2 text-primary"></i>{{ dashboard.company.company_name }}</h2>
                    <p class="text-muted mb-0">{{ dashboard.company.industry || 'Company Dashboard' }}</p>
                </div>
                <router-link to="/company/create-drive" class="btn btn-primary">
                    <i class="bi bi-plus-circle me-2"></i>New Drive
                </router-link>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card stat-card border-0 shadow-sm">
                        <div class="card-body d-flex align-items-center">
                            <div class="stat-icon bg-primary-subtle text-primary me-3"><i class="bi bi-briefcase-fill fs-4"></i></div>
                            <div><h3 class="fw-bold mb-0">{{ dashboard.total_drives }}</h3><small class="text-muted">Total Drives</small></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stat-card border-0 shadow-sm">
                        <div class="card-body d-flex align-items-center">
                            <div class="stat-icon bg-success-subtle text-success me-3"><i class="bi bi-people-fill fs-4"></i></div>
                            <div><h3 class="fw-bold mb-0">{{ dashboard.total_applicants }}</h3><small class="text-muted">Total Applicants</small></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card stat-card border-0 shadow-sm">
                        <div class="card-body d-flex align-items-center">
                            <div class="stat-icon bg-info-subtle text-info me-3"><i class="bi bi-check-circle-fill fs-4"></i></div>
                            <div><h3 class="fw-bold mb-0">{{ dashboard.company.approval_status }}</h3><small class="text-muted">Approval Status</small></div>
                        </div>
                    </div>
                </div>
            </div>

            <h5 class="fw-bold mb-3">Your Placement Drives</h5>
            <div v-if="dashboard.drives.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-briefcase fs-1"></i>
                <p class="mt-2">No drives created yet. <router-link to="/company/create-drive">Create your first drive</router-link></p>
            </div>
            <div class="row g-3" v-else>
                <div class="col-md-6" v-for="d in dashboard.drives" :key="d.id">
                    <div class="card border-0 shadow-sm h-100 drive-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="fw-bold mb-0">{{ d.job_title }}</h5>
                                <span class="badge rounded-pill" :class="statusBadge(d.status)">{{ d.status }}</span>
                            </div>
                            <p class="text-muted small mb-3" style="max-height:50px;overflow:hidden">{{ d.job_description }}</p>
                            <div class="d-flex flex-wrap gap-2 mb-3">
                                <span class="badge bg-light text-dark"><i class="bi bi-currency-rupee"></i>{{ d.package_lpa || '—' }} LPA</span>
                                <span class="badge bg-light text-dark"><i class="bi bi-calendar me-1"></i>{{ formatDate(d.application_deadline) }}</span>
                                <span class="badge bg-primary-subtle text-primary"><i class="bi bi-people me-1"></i>{{ d.applicant_count }} applicants</span>
                            </div>
                            <router-link v-if="d.status === 'approved'" :to="'/company/drives/' + d.id + '/applications'" class="btn btn-outline-primary btn-sm w-100">
                                <i class="bi bi-eye me-1"></i>View Applications
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
