const AdminCompaniesComponent = {
    data() {
        return { companies: [], search: '', statusFilter: '', loading: true };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const params = {};
                if (this.search) params.search = this.search;
                if (this.statusFilter) params.status = this.statusFilter;
                const res = await API.get('/admin/companies', { params });
                this.companies = res.data;
            } catch (err) { showToast('Failed to load companies', 'error'); }
            finally { this.loading = false; }
        },
        async approve(id) {
            try { await API.put('/admin/companies/' + id + '/approve'); showToast('Company approved!'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
        },
        async reject(id) {
            try { await API.put('/admin/companies/' + id + '/reject'); showToast('Company rejected'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
        },
        async blacklist(id) {
            try { await API.put('/admin/companies/' + id + '/blacklist'); showToast('Blacklist toggled'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
        },
        statusBadge(s) {
            return s === 'approved' ? 'bg-success' : s === 'pending' ? 'bg-warning text-dark' : 'bg-danger';
        }
    },
    template: `
    <div class="container py-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-building me-2 text-primary"></i>Manage Companies</h2>
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-md-6">
                        <label class="form-label fw-medium">Search</label>
                        <input type="text" class="form-control" v-model="search" @input="load" placeholder="Search by name...">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-medium">Status</label>
                        <select class="form-select" v-model="statusFilter" @change="load">
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" @click="search=''; statusFilter=''; load()">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="companies.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-building fs-1"></i><p class="mt-2">No companies found</p>
        </div>
        <div v-else class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Company</th><th>Industry</th><th>HR Contact</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in companies" :key="c.id" :class="{ 'table-danger': c.is_blacklisted }">
                            <td>
                                <div class="fw-semibold">{{ c.company_name }}</div>
                                <small class="text-muted">{{ c.email }}</small>
                            </td>
                            <td>{{ c.industry || '—' }}</td>
                            <td>
                                <div>{{ c.hr_name || '—' }}</div>
                                <small class="text-muted">{{ c.hr_email || '' }}</small>
                            </td>
                            <td><span class="badge rounded-pill" :class="statusBadge(c.approval_status)">{{ c.approval_status }}</span></td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button v-if="c.approval_status === 'pending'" class="btn btn-outline-success" @click="approve(c.id)" title="Approve">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                    <button v-if="c.approval_status === 'pending'" class="btn btn-outline-danger" @click="reject(c.id)" title="Reject">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                    <button class="btn btn-outline-dark" @click="blacklist(c.id)" :title="c.is_blacklisted ? 'Unblacklist' : 'Blacklist'">
                                        <i :class="c.is_blacklisted ? 'bi bi-unlock' : 'bi bi-slash-circle'"></i>
                                    </button>
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
