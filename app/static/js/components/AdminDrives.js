const AdminDrivesComponent = {
    data() {
        return { drives: [], search: '', statusFilter: '', loading: true };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const params = {};
                if (this.search) params.search = this.search;
                if (this.statusFilter) params.status = this.statusFilter;
                const res = await API.get('/admin/drives', { params });
                this.drives = res.data;
            } catch (err) { showToast('Failed to load drives', 'error'); }
            finally { this.loading = false; }
        },
        async approve(id) {
            try { await API.put('/admin/drives/' + id + '/approve'); showToast('Drive approved!'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
        },
        async reject(id) {
            try { await API.put('/admin/drives/' + id + '/reject'); showToast('Drive rejected'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
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
        <h2 class="fw-bold mb-4"><i class="bi bi-briefcase me-2 text-primary"></i>Manage Placement Drives</h2>
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-md-6">
                        <input type="text" class="form-control" v-model="search" @input="load" placeholder="Search by job title...">
                    </div>
                    <div class="col-md-4">
                        <select class="form-select" v-model="statusFilter" @change="load">
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" @click="search=''; statusFilter=''; load()"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="drives.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-briefcase fs-1"></i><p class="mt-2">No drives found</p>
        </div>
        <div v-else class="row g-3">
            <div class="col-md-6" v-for="d in drives" :key="d.id">
                <div class="card border-0 shadow-sm h-100 drive-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold mb-0">{{ d.job_title }}</h5>
                            <span class="badge rounded-pill" :class="statusBadge(d.status)">{{ d.status }}</span>
                        </div>
                        <p class="text-primary fw-medium mb-2"><i class="bi bi-building me-1"></i>{{ d.company_name }}</p>
                        <p class="text-muted small mb-2" style="max-height:60px;overflow:hidden">{{ d.job_description }}</p>
                        <div class="row g-2 mb-3">
                            <div class="col-auto"><span class="badge bg-light text-dark"><i class="bi bi-currency-rupee"></i>{{ d.package_lpa || '—' }} LPA</span></div>
                            <div class="col-auto"><span class="badge bg-light text-dark"><i class="bi bi-calendar me-1"></i>{{ formatDate(d.application_deadline) }}</span></div>
                            <div class="col-auto"><span class="badge bg-light text-dark"><i class="bi bi-people me-1"></i>{{ d.application_count }} applicants</span></div>
                        </div>
                        <div v-if="d.status === 'pending'" class="d-flex gap-2">
                            <button class="btn btn-success btn-sm flex-fill" @click="approve(d.id)"><i class="bi bi-check-lg me-1"></i>Approve</button>
                            <button class="btn btn-danger btn-sm flex-fill" @click="reject(d.id)"><i class="bi bi-x-lg me-1"></i>Reject</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
