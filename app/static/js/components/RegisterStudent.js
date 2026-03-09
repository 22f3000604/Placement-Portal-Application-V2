const RegisterStudentComponent = {
    mixins: [ValidationMixin],
    data() {
        return {
            form: { email: '', password: '', full_name: '', roll_number: '', branch: '', year: '', cgpa: '', phone: '' },
            error: '',
            fieldErrors: {},
            loading: false,
            branches: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'Chemical', 'Biotechnology']
        };
    },
    methods: {
        validationRules() {
            return {
                full_name: Validators.required(this.form.full_name, 'Full name'),
                roll_number: Validators.required(this.form.roll_number, 'Roll number'),
                email: Validators.email(this.form.email),
                password: Validators.password(this.form.password),
                branch: Validators.required(this.form.branch, 'Branch'),
                year: Validators.required(this.form.year, 'Year'),
                cgpa: Validators.cgpa(this.form.cgpa),
                phone: Validators.phone(this.form.phone)
            };
        },
        async register() {
            this.error = '';
            if (!this.validateForm()) return;
            this.loading = true;
            try {
                await API.post('/register/student', this.form);
                showToast('Registration successful! Please login.');
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
                        <div class="brand-icon mx-auto mb-3"><i class="bi bi-person-plus-fill"></i></div>
                        <h2 class="fw-bold text-white">Student Registration</h2>
                        <p class="text-white-50">Create your placement portal account</p>
                    </div>
                    <div class="card glass-card p-4">
                        <form @submit.prevent="register" novalidate>
                            <div class="alert alert-danger" v-if="error"><i class="bi bi-exclamation-triangle me-2"></i>{{ error }}</div>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Full Name*</label>
                                    <input type="text" class="form-control" :class="fieldClass('full_name')" v-model="form.full_name" @input="clearFieldError('full_name')">
                                    <div class="invalid-feedback" v-if="fieldErrors.full_name">{{ fieldErrors.full_name }}</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-medium">Roll Number*</label>
                                    <input type="text" class="form-control" :class="fieldClass('roll_number')" v-model="form.roll_number" @input="clearFieldError('roll_number')">
                                    <div class="invalid-feedback" v-if="fieldErrors.roll_number">{{ fieldErrors.roll_number }}</div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Email*</label>
                                    <input type="email" class="form-control" :class="fieldClass('email')" v-model="form.email" @input="clearFieldError('email')">
                                    <div class="invalid-feedback" v-if="fieldErrors.email">{{ fieldErrors.email }}</div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Password*</label>
                                    <input type="password" class="form-control" :class="fieldClass('password')" v-model="form.password" @input="clearFieldError('password')">
                                    <div class="invalid-feedback" v-if="fieldErrors.password">{{ fieldErrors.password }}</div>
                                    <small class="text-muted">Min 6 chars, must include a letter and a number</small>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Branch*</label>
                                    <select class="form-select" :class="fieldClass('branch')" v-model="form.branch" @change="clearFieldError('branch')">
                                        <option value="">Select</option>
                                        <option v-for="b in branches" :value="b">{{ b }}</option>
                                    </select>
                                    <div class="invalid-feedback" v-if="fieldErrors.branch">{{ fieldErrors.branch }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">Year*</label>
                                    <select class="form-select" :class="fieldClass('year')" v-model="form.year" @change="clearFieldError('year')">
                                        <option value="">Select</option>
                                        <option v-for="y in [1,2,3,4]" :value="y">Year {{ y }}</option>
                                    </select>
                                    <div class="invalid-feedback" v-if="fieldErrors.year">{{ fieldErrors.year }}</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label fw-medium">CGPA*</label>
                                    <input type="number" step="0.01" min="0" max="10" class="form-control" :class="fieldClass('cgpa')" v-model="form.cgpa" @input="clearFieldError('cgpa')">
                                    <div class="invalid-feedback" v-if="fieldErrors.cgpa">{{ fieldErrors.cgpa }}</div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-medium">Phone</label>
                                    <input type="tel" class="form-control" :class="fieldClass('phone')" v-model="form.phone" @input="clearFieldError('phone')" placeholder="10-digit mobile number">
                                    <div class="invalid-feedback" v-if="fieldErrors.phone">{{ fieldErrors.phone }}</div>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2 mt-4 fw-semibold" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ loading ? 'Registering...' : 'Create Account' }}
                            </button>
                        </form>
                        <div class="text-center mt-3">
                            <router-link to="/login" class="text-decoration-none">Already have an account? Sign in</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
