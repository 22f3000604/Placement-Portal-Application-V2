const AdminApplicationsComponent = {
    data() {
        return { applications: [], statusFilter: '', loading: true, generatingLetter: null };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const params = {};
                if (this.statusFilter) params.status = this.statusFilter;
                const res = await API.get('/admin/applications', { params });
                this.applications = res.data;
            } catch (err) { showToast('Failed to load applications', 'error'); }
            finally { this.loading = false; }
        },
        statusBadge(s) {
            const m = { applied: 'bg-info', shortlisted: 'bg-warning text-dark', selected: 'bg-success', rejected: 'bg-danger' };
            return m[s] || 'bg-secondary';
        },
        formatDate(d) {
            return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        },
        async generateOfferLetter(applicationId) {
            this.generatingLetter = applicationId;
            try {
                const res = await API.post('/admin/offer-letter',
                    { application_id: applicationId },
                    { responseType: 'blob' }
                );
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'offer_letter.pdf';
                a.click();
                window.URL.revokeObjectURL(url);
                showToast('Offer letter generated!');
            } catch (err) {
                showToast('Failed to generate offer letter', 'error');
            } finally {
                this.generatingLetter = null;
            }
        }
    },
    template: `
    <div class="container py-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-file-earmark-text me-2 text-primary"></i>All Applications</h2>
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-2">
                    <div class="col-md-4">
                        <select class="form-select" v-model="statusFilter" @change="load">
                            <option value="">All Status</option>
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="selected">Selected</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="applications.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-file-earmark fs-1"></i><p class="mt-2">No applications found</p>
        </div>
        <div v-else class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr><th>Student</th><th>Roll No</th><th>Company</th><th>Drive</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="a in applications" :key="a.id">
                            <td class="fw-semibold">{{ a.student_name }}</td>
                            <td>{{ a.student_roll }}</td>
                            <td>{{ a.company_name }}</td>
                            <td>{{ a.drive_title }}</td>
                            <td>{{ formatDate(a.applied_at) }}</td>
                            <td><span class="badge rounded-pill" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                            <td>
                                <button v-if="a.status === 'selected'"
                                        class="btn btn-outline-success btn-sm"
                                        @click="generateOfferLetter(a.id)"
                                        :disabled="generatingLetter === a.id"
                                        title="Generate Offer Letter">
                                    <span v-if="generatingLetter === a.id" class="spinner-border spinner-border-sm"></span>
                                    <i v-else class="bi bi-file-earmark-pdf"></i>
                                    Offer Letter
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `
};
