const LoginComponent = {
    emits: ['login-success'],
    mixins: [ValidationMixin],
    data() {
        return {
            email: '',
            password: '',
            error: '',
            fieldErrors: {},
            loading: false
        };
    },
    methods: {
        validationRules() {
            return {
                email: Validators.email(this.email),
                password: Validators.required(this.password, 'Password')
            };
        },
        async login() {
            this.error = '';
            if (!this.validateForm()) return;
            this.loading = true;
            try {
                const res = await API.post('/login', { email: this.email, password: this.password });
                localStorage.setItem('access_token', res.data.access_token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                this.$emit('login-success', res.data.user);
                showToast('Login successful!');
                // Redirect based on role
                const role = res.data.user.role;
                if (role === 'admin') this.$router.push('/admin/dashboard');
                else if (role === 'company') this.$router.push('/company/dashboard');
                else this.$router.push('/student/dashboard');
            } catch (err) {
                this.error = err.response?.data?.error || 'Login failed';
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
    <div class="auth-page d-flex align-items-center justify-content-center min-vh-100">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-5">
                    <div class="text-center mb-4">
                        <div class="brand-icon mx-auto mb-3">
                            <i class="bi bi-mortarboard-fill"></i>
                        </div>
                        <h2 class="fw-bold text-white">Placement Portal</h2>
                        <p class="text-white-50">Sign in to your account</p>
                    </div>
                    <div class="card glass-card p-4">
                        <form @submit.prevent="login" novalidate>
                            <div class="alert alert-danger d-flex align-items-center" v-if="error">
                                <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-medium">Email</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                    <input type="email" class="form-control" :class="fieldClass('email')" v-model="email" @input="clearFieldError('email')" placeholder="your@email.com" id="loginEmail">
                                </div>
                                <div class="invalid-feedback d-block" v-if="fieldErrors.email">{{ fieldErrors.email }}</div>
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-medium">Password</label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                                    <input type="password" class="form-control" :class="fieldClass('password')" v-model="password" @input="clearFieldError('password')" placeholder="••••••••" id="loginPassword">
                                </div>
                                <div class="invalid-feedback d-block" v-if="fieldErrors.password">{{ fieldErrors.password }}</div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" :disabled="loading" id="loginBtn">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ loading ? 'Signing in...' : 'Sign In' }}
                            </button>
                        </form>
                        <hr class="my-4">
                        <div class="text-center">
                            <p class="mb-2 text-muted">Don't have an account?</p>
                            <router-link to="/register/student" class="btn btn-outline-primary me-2">
                                <i class="bi bi-person-plus me-1"></i>Student
                            </router-link>
                            <router-link to="/register/company" class="btn btn-outline-success">
                                <i class="bi bi-building-add me-1"></i>Company
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
