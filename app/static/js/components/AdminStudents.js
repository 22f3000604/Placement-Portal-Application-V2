const AdminStudentsComponent = {
    data() {
        return { students: [], search: '', loading: true };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const params = {};
                if (this.search) params.search = this.search;
                const res = await API.get('/admin/students', { params });
                this.students = res.data;
            } catch (err) { showToast('Failed to load students', 'error'); }
            finally { this.loading = false; }
        },
        async blacklist(id) {
            try { await API.put('/admin/students/' + id + '/blacklist'); showToast('Blacklist toggled'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
        },
        async deactivate(id) {
            try { await API.put('/admin/students/' + id + '/deactivate'); showToast('Status toggled'); this.load(); }
            catch (err) { showToast('Action failed', 'error'); }
        }
    },
    template: `
    <div class="container py-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-people me-2 text-primary"></i>Manage Students</h2>
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-2">
                    <div class="col-md-10">
                        <input type="text" class="form-control" v-model="search" @input="load" placeholder="Search by name, roll number, or branch...">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" @click="search=''; load()"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="students.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-people fs-1"></i><p class="mt-2">No students found</p>
        </div>
        <div v-else class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr><th>Student</th><th>Roll No</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="s in students" :key="s.id" :class="{ 'table-danger': s.is_blacklisted }">
                            <td>
                                <div class="fw-semibold">{{ s.full_name }}</div>
                                <small class="text-muted">{{ s.email }}</small>
                            </td>
                            <td>{{ s.roll_number }}</td>
                            <td><span class="badge bg-primary-subtle text-primary">{{ s.branch }}</span></td>
                            <td>{{ s.year }}</td>
                            <td><span class="fw-semibold">{{ s.cgpa }}</span></td>
                            <td>
                                <span v-if="s.is_blacklisted" class="badge bg-danger">Blacklisted</span>
                                <span v-else class="badge bg-success">Active</span>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-dark" @click="blacklist(s.id)" :title="s.is_blacklisted ? 'Unblacklist' : 'Blacklist'">
                                        <i :class="s.is_blacklisted ? 'bi bi-unlock' : 'bi bi-slash-circle'"></i>
                                    </button>
                                    <button class="btn btn-outline-warning" @click="deactivate(s.id)" title="Activate/Deactivate">
                                        <i class="bi bi-power"></i>
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
