const CompanyCreateDriveComponent = {
    mixins: [ValidationMixin],
    data() {
        return {
            form: {
                job_title: '', job_description: '', package_lpa: '', location: '',
                eligibility_branch: '', eligibility_cgpa: '',
                application_deadline: ''
            },
            error: '', fieldErrors: {}, loading: false,
            branches: ['All', 'CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'Chemical', 'Biotechnology']
        };
    },
    methods: {
        validationRules() {
            return {
                job_title: Validators.required(this.form.job_title, 'Job title'),
                job_description: Validators.required(this.form.job_description, 'Job description'),
                application_deadline: Validators.futureDate(this.form.application_deadline, 'Application deadline'),
                package_lpa: Validators.packageLpa(this.form.package_lpa),
                eligibility_cgpa: this.form.eligibility_cgpa ? Validators.cgpa(this.form.eligibility_cgpa) : ''
            };
        },
        async create() {
            this.error = '';
            if (!this.validateForm()) return;
            this.loading = true;
            try {
                await API.post('/company/drives', this.form);
                showToast('Drive created! Awaiting admin approval.');
                this.$router.push('/company/dashboard');
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to create drive';
            } finally { this.loading = false; }
        }
    },
    template: `
    <div class="container py-4">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="d-flex align-items-center mb-4">
                    <router-link to="/company/dashboard" class="btn btn-outline-secondary me-3"><i class="bi bi-arrow-left"></i></router-link>
                    <h2 class="fw-bold mb-0"><i class="bi bi-plus-circle me-2 text-primary"></i>Create Placement Drive</h2>
                </div>
                <div class="card border-0 shadow-sm">
                    <div class="card-body p-4">
                        <form @submit.prevent="create" novalidate>
                            <div class="alert alert-danger" v-if="error"><i class="bi bi-exclamation-triangle me-2"></i>{{ error }}</div>

                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Job Title*</label>
                                    <input type="text" class="form-control" :class="fieldClass('job_title')" v-model="form.job_title" @input="clearFieldError('job_title')" placeholder="e.g., Software Engineer">
                                    <div class="invalid-feedback" v-if="fieldErrors.job_title">{{ fieldErrors.job_title }}</div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Job Description*</label>
                                    <textarea class="form-control" :class="fieldClass('job_description')" rows="4" v-model="form.job_description" @input="clearFieldError('job_description')" placeholder="Describe the role, responsibilities, and requirements"></textarea>
                                    <div class="invalid-feedback" v-if="fieldErrors.job_description">{{ fieldErrors.job_description }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Package (LPA)</label>
                                    <input type="number" step="0.1" min="0" class="form-control" :class="fieldClass('package_lpa')" v-model="form.package_lpa" @input="clearFieldError('package_lpa')" placeholder="e.g., 8.5">
                                    <div class="invalid-feedback" v-if="fieldErrors.package_lpa">{{ fieldErrors.package_lpa }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Location</label>
                                    <input type="text" class="form-control" v-model="form.location" placeholder="e.g., Bangalore">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Deadline*</label>
                                    <input type="date" class="form-control" :class="fieldClass('application_deadline')" v-model="form.application_deadline" @input="clearFieldError('application_deadline')">
                                    <div class="invalid-feedback" v-if="fieldErrors.application_deadline">{{ fieldErrors.application_deadline }}</div>
                                </div>

                                <div class="col-12"><hr><h6 class="fw-semibold text-muted">Eligibility Criteria</h6></div>

                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Branches</label>
                                    <select class="form-select" v-model="form.eligibility_branch">
                                        <option value="">Any Branch</option>
                                        <option v-for="b in branches" :value="b">{{ b }}</option>
                                    </select>
                                    <small class="text-muted">Comma-separated for multiple</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Min CGPA</label>
                                    <input type="number" step="0.1" min="0" max="10" class="form-control" :class="fieldClass('eligibility_cgpa')" v-model="form.eligibility_cgpa" @input="clearFieldError('eligibility_cgpa')" placeholder="e.g., 7.0">
                                    <div class="invalid-feedback" v-if="fieldErrors.eligibility_cgpa">{{ fieldErrors.eligibility_cgpa }}</div>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2 mt-4 fw-semibold" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ loading ? 'Creating...' : 'Create Placement Drive' }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
