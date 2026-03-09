const StudentProfileComponent = {
    mixins: [ValidationMixin],
    data() {
        return {
            profile: null, loading: true, saving: false, uploading: false,
            form: { full_name: '', branch: '', year: '', cgpa: '', phone: '' },
            fieldErrors: {},
            branches: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'Chemical', 'Biotechnology']
        };
    },
    async mounted() { await this.load(); },
    methods: {
        validationRules() {
            return {
                full_name: Validators.required(this.form.full_name, 'Full name'),
                cgpa: Validators.cgpa(this.form.cgpa),
                phone: Validators.phone(this.form.phone)
            };
        },
        async load() {
            try {
                const res = await API.get('/student/profile');
                this.profile = res.data;
                this.form = {
                    full_name: res.data.full_name || '',
                    branch: res.data.branch || '',
                    year: res.data.year || '',
                    cgpa: res.data.cgpa || '',
                    phone: res.data.phone || ''
                };
            } catch (err) { showToast('Failed to load profile', 'error'); }
            finally { this.loading = false; }
        },
        async save() {
            if (!this.validateForm()) return;
            this.saving = true;
            try {
                const res = await API.put('/student/profile', this.form);
                this.profile = res.data.student;
                showToast('Profile updated!');
            } catch (err) { showToast(err.response?.data?.error || 'Update failed', 'error'); }
            finally { this.saving = false; }
        },
        async uploadResume() {
            const input = document.getElementById('resumeInput');
            if (!input.files.length) {
                showToast('Please select a resume file', 'error');
                return;
            }
            const file = input.files[0];
            // Validate file
            const typeErr = Validators.fileType(file, ['pdf', 'doc', 'docx']);
            if (typeErr) { showToast(typeErr, 'error'); return; }
            const sizeErr = Validators.maxFileSize(file, 5);
            if (sizeErr) { showToast(sizeErr, 'error'); return; }

            this.uploading = true;
            try {
                const fd = new FormData();
                fd.append('resume', file);
                const res = await axios.post('/api/student/profile/resume', fd, {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token'), 'Content-Type': 'multipart/form-data' }
                });
                showToast('Resume uploaded!');
                this.load();
            } catch (err) { showToast(err.response?.data?.error || 'Upload failed', 'error'); }
            finally { this.uploading = false; }
        }
    },
    template: `
    <div class="container py-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-person me-2 text-primary"></i>My Profile</h2>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else class="row g-4">
            <div class="col-md-8">
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-4">
                        <h5 class="fw-bold mb-3">Edit Profile</h5>
                        <form @submit.prevent="save" novalidate>
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Full Name</label>
                                    <input type="text" class="form-control" :class="fieldClass('full_name')" v-model="form.full_name" @input="clearFieldError('full_name')">
                                    <div class="invalid-feedback" v-if="fieldErrors.full_name">{{ fieldErrors.full_name }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Branch</label>
                                    <select class="form-select" v-model="form.branch">
                                        <option v-for="b in branches" :value="b">{{ b }}</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Year</label>
                                    <select class="form-select" v-model="form.year">
                                        <option v-for="y in [1,2,3,4]" :value="y">Year {{ y }}</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">CGPA</label>
                                    <input type="number" step="0.01" min="0" max="10" class="form-control" :class="fieldClass('cgpa')" v-model="form.cgpa" @input="clearFieldError('cgpa')">
                                    <div class="invalid-feedback" v-if="fieldErrors.cgpa">{{ fieldErrors.cgpa }}</div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Phone</label>
                                    <input type="tel" class="form-control" :class="fieldClass('phone')" v-model="form.phone" @input="clearFieldError('phone')">
                                    <div class="invalid-feedback" v-if="fieldErrors.phone">{{ fieldErrors.phone }}</div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary mt-3" :disabled="saving">
                                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                                {{ saving ? 'Saving...' : 'Save Changes' }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body text-center p-4">
                        <div class="avatar-lg mx-auto mb-3">{{ profile.full_name ? profile.full_name[0].toUpperCase() : '?' }}</div>
                        <h5 class="fw-bold">{{ profile.full_name }}</h5>
                        <p class="text-muted mb-1">{{ profile.roll_number }}</p>
                        <span class="badge bg-primary-subtle text-primary">{{ profile.branch }}</span>
                        <span class="badge bg-success-subtle text-success">Year {{ profile.year }}</span>
                        <p class="mt-2 mb-0 fw-semibold">CGPA: {{ profile.cgpa }}</p>
                    </div>
                </div>
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-4">
                        <h6 class="fw-bold mb-3"><i class="bi bi-file-earmark-pdf me-2"></i>Resume</h6>
                        <p v-if="profile.resume_path" class="text-success small"><i class="bi bi-check-circle me-1"></i>{{ profile.resume_path }}</p>
                        <p v-else class="text-muted small">No resume uploaded</p>
                        <input type="file" class="form-control form-control-sm mb-2" id="resumeInput" accept=".pdf,.doc,.docx">
                        <small class="text-muted d-block mb-2">PDF, DOC, DOCX — Max 5MB</small>
                        <button class="btn btn-outline-primary btn-sm w-100" @click="uploadResume" :disabled="uploading">
                            <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ uploading ? 'Uploading...' : 'Upload Resume' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
