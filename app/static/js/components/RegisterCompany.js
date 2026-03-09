const RegisterCompanyComponent = {
    mixins: [ValidationMixin],
    data() {
        return {
            form: { email: '', password: '', company_name: '', industry: '', hr_name: '', hr_email: '', hr_phone: '', website: '', description: '' },
            error: '',
            fieldErrors: {},
            loading: false
        };
    },
    methods: {
        validationRules() {
            return {
                company_name: Validators.required(this.form.company_name, 'Company name'),
                email: Validators.email(this.form.email),
                password: Validators.password(this.form.password),
                hr_email: this.form.hr_email ? Validators.email(this.form.hr_email) : '',
                hr_phone: Validators.phone(this.form.hr_phone),
                website: Validators.url(this.form.website)
            };
        },
        async register() {
            this.error = '';
            if (!this.validateForm()) return;
            this.loading = true;
            try {
                await API.post('/register/company', this.form);
                showToast('Company registered! Awaiting admin approval.', 'success');
                this.$router.push('/login');
            } catch (err) {
                this.error = err.response?.data?.error || 'Registration failed';
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
    <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="text-center mb-4">
                        <div class="brand-icon mx-auto mb-3 bg-success-subtle text-success"><i class="bi bi-building-add"></i></div>
                        <h2 class="fw-bold text-white">Company Registration</h2>
                        <p class="text-white-50">Register your organization for campus recruitment</p>
                    </div>
                    <div class="card glass-card p-4">
                        <form @submit.prevent="register" novalidate>
                            <div class="alert alert-danger" v-if="error"><i class="bi bi-exclamation-triangle me-2"></i>{{ error }}</div>
                            <div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>After registration, your account will be reviewed and approved by the admin.</div>

                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Company Name*</label>
                                    <input type="text" class="form-control" :class="fieldClass('company_name')" v-model="form.company_name" @input="clearFieldError('company_name')">
                                    <div class="invalid-feedback" v-if="fieldErrors.company_name">{{ fieldErrors.company_name }}</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Email*</label>
                                    <input type="email" class="form-control" :class="fieldClass('email')" v-model="form.email" @input="clearFieldError('email')">
                                    <div class="invalid-feedback" v-if="fieldErrors.email">{{ fieldErrors.email }}</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Password*</label>
                                    <input type="password" class="form-control" :class="fieldClass('password')" v-model="form.password" @input="clearFieldError('password')">
                                    <div class="invalid-feedback" v-if="fieldErrors.password">{{ fieldErrors.password }}</div>
                                    <small class="text-muted">Min 6 chars, letter + number</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Industry</label>
                                    <input type="text" class="form-control" v-model="form.industry" placeholder="e.g., IT, Finance">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Website</label>
                                    <input type="url" class="form-control" :class="fieldClass('website')" v-model="form.website" @input="clearFieldError('website')" placeholder="https://">
                                    <div class="invalid-feedback" v-if="fieldErrors.website">{{ fieldErrors.website }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">HR Name</label>
                                    <input type="text" class="form-control" v-model="form.hr_name">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">HR Email</label>
                                    <input type="email" class="form-control" :class="fieldClass('hr_email')" v-model="form.hr_email" @input="clearFieldError('hr_email')">
                                    <div class="invalid-feedback" v-if="fieldErrors.hr_email">{{ fieldErrors.hr_email }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">HR Phone</label>
                                    <input type="tel" class="form-control" :class="fieldClass('hr_phone')" v-model="form.hr_phone" @input="clearFieldError('hr_phone')">
                                    <div class="invalid-feedback" v-if="fieldErrors.hr_phone">{{ fieldErrors.hr_phone }}</div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Description</label>
                                    <textarea class="form-control" rows="3" v-model="form.description" placeholder="Brief about your company"></textarea>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-success w-100 py-2 mt-4 fw-semibold" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ loading ? 'Registering...' : 'Register Company' }}
                            </button>
                        </form>
                        <div class="text-center mt-3">
                            <router-link to="/login" class="text-decoration-none">Already registered? Sign in</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
