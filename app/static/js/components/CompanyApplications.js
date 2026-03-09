const CompanyApplicationsComponent = {
    data() {
        return { drive: null, applications: [], loading: true };
    },
    async mounted() {
        const driveId = this.$route.params.driveId;
        await this.load(driveId);
    },
    methods: {
        async load(driveId) {
            try {
                const res = await API.get('/company/drives/' + driveId + '/applications');
                this.drive = res.data.drive;
                this.applications = res.data.applications;
            } catch (err) { showToast('Failed to load applications', 'error'); }
            finally { this.loading = false; }
        },
        async updateStatus(appId, status) {
            try {
                await API.put('/company/applications/' + appId + '/status', { status });
                showToast('Status updated to ' + status);
                await this.load(this.$route.params.driveId);
            } catch (err) { showToast('Failed to update status', 'error'); }
        },
        downloadResume(appId) {
            API.get('/company/applications/' + appId + '/resume', { responseType: 'blob' })
                .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'resume_' + appId + '.pdf';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                })
                .catch(() => showToast('Failed to download resume', 'error'));
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
        <div class="d-flex align-items-center mb-4">
            <router-link to="/company/dashboard" class="btn btn-outline-secondary me-3"><i class="bi bi-arrow-left"></i></router-link>
            <div>
                <h2 class="fw-bold mb-0" v-if="drive">{{ drive.job_title }}</h2>
                <p class="text-muted mb-0">Applications</p>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="applications.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1"></i><p class="mt-2">No applications yet</p>
        </div>
        <div v-else class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr><th>Student</th><th>Roll No</th><th>Branch</th><th>CGPA</th><th>Resume</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="a in applications" :key="a.id">
                            <td class="fw-semibold">{{ a.student_name }}</td>
                            <td>{{ a.student_roll }}</td>
                            <td><span class="badge bg-primary-subtle text-primary">{{ a.student_branch }}</span></td>
                            <td>{{ a.student_cgpa }}</td>
                            <td>
                                <button v-if="a.resume_path" class="btn btn-outline-primary btn-sm" @click="downloadResume(a.id)" title="Download Resume">
                                    <i class="bi bi-file-earmark-arrow-down me-1"></i>Download
                                </button>
                                <span v-else class="text-muted small">—</span>
                            </td>
                            <td>{{ formatDate(a.applied_at) }}</td>
                            <td><span class="badge rounded-pill" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                            <td>
                                <div class="dropdown">
                                    <button class="btn btn-outline-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                        Update
                                    </button>
                                    <ul class="dropdown-menu shadow">
                                        <li><a class="dropdown-item" href="#" @click.prevent="updateStatus(a.id, 'shortlisted')"><i class="bi bi-bookmark me-2 text-warning"></i>Shortlist</a></li>
                                        <li><a class="dropdown-item" href="#" @click.prevent="updateStatus(a.id, 'selected')"><i class="bi bi-check-circle me-2 text-success"></i>Select</a></li>
                                        <li><a class="dropdown-item" href="#" @click.prevent="updateStatus(a.id, 'rejected')"><i class="bi bi-x-circle me-2 text-danger"></i>Reject</a></li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `
};
