const StudentHistoryComponent = {
    data() {
        return { applications: [], loading: true, exporting: false };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await API.get('/student/applications');
                this.applications = res.data;
            } catch (err) { showToast('Failed to load history', 'error'); }
            finally { this.loading = false; }
        },
        async exportCSV() {
            this.exporting = true;
            try {
                const res = await API.post('/student/export');
                showToast(res.data.message);
            } catch (err) {
                showToast(err.response?.data?.error || 'Export failed', 'error');
            } finally { this.exporting = false; }
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
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold mb-0"><i class="bi bi-clock-history me-2 text-primary"></i>Application History</h2>
            <button class="btn btn-outline-primary" @click="exportCSV" :disabled="exporting">
                <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-download me-2"></i>{{ exporting ? 'Exporting...' : 'Export CSV' }}
            </button>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="applications.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1"></i><p class="mt-2">No application history</p>
        </div>
        <div v-else>
            <div class="row g-3 mb-3">
                <div class="col-auto">
                    <span class="badge bg-light text-dark fs-6">Total: {{ applications.length }}</span>
                </div>
                <div class="col-auto">
                    <span class="badge bg-success-subtle text-success fs-6">Selected: {{ applications.filter(a => a.status === 'selected').length }}</span>
                </div>
                <div class="col-auto">
                    <span class="badge bg-warning-subtle text-warning fs-6">Shortlisted: {{ applications.filter(a => a.status === 'shortlisted').length }}</span>
                </div>
                <div class="col-auto">
                    <span class="badge bg-danger-subtle text-danger fs-6">Rejected: {{ applications.filter(a => a.status === 'rejected').length }}</span>
                </div>
            </div>
            <div class="card border-0 shadow-sm">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th>#</th><th>Company</th><th>Drive</th><th>Applied</th><th>Status</th><th>Remarks</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="(a, i) in applications" :key="a.id">
                                <td>{{ i + 1 }}</td>
                                <td class="fw-semibold">{{ a.company_name }}</td>
                                <td>{{ a.drive_title }}</td>
                                <td>{{ formatDate(a.applied_at) }}</td>
                                <td><span class="badge rounded-pill" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                                <td class="text-muted small">{{ a.remarks || '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `
};
