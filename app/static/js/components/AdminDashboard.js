const AdminDashboardComponent = {
    data() {
        return { stats: null, analytics: null, loading: true, downloading: false, charts: {} };
    },
    async mounted() {
        await this.loadStats();
    },
    beforeUnmount() {
        Object.values(this.charts).forEach(c => c && c.destroy());
    },
    methods: {
        async loadStats() {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    API.get('/admin/dashboard'),
                    API.get('/admin/analytics')
                ]);
                this.stats = statsRes.data;
                this.analytics = analyticsRes.data;
                this.loading = false;
                this.$nextTick(() => this.renderCharts());
            } catch (err) {
                showToast('Failed to load dashboard', 'error');
                this.loading = false;
            }
        },
        renderCharts() {
            if (!this.analytics) return;

            // Destroy existing charts
            Object.values(this.charts).forEach(c => c && c.destroy());

            // 1. Application Status Doughnut
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx) {
                this.charts.status = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: this.analytics.application_status.labels,
                        datasets: [{
                            data: this.analytics.application_status.data,
                            backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        cutout: '65%',
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { size: 12 } } }
                        }
                    }
                });
            }

            // 2. Top Companies Bar Chart
            const companiesCtx = document.getElementById('companiesChart');
            if (companiesCtx && this.analytics.top_companies.labels.length) {
                this.charts.companies = new Chart(companiesCtx, {
                    type: 'bar',
                    data: {
                        labels: this.analytics.top_companies.labels,
                        datasets: [{
                            label: 'Applications',
                            data: this.analytics.top_companies.data,
                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                            borderColor: '#6366f1',
                            borderWidth: 1,
                            borderRadius: 6,
                            barThickness: 30
                        }]
                    },
                    options: {
                        responsive: true,
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } },
                            y: { grid: { display: false } }
                        }
                    }
                });
            }

            // 3. Branch Distribution Pie
            const branchCtx = document.getElementById('branchChart');
            if (branchCtx && this.analytics.branch_distribution.labels.length) {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#ec4899'];
                this.charts.branch = new Chart(branchCtx, {
                    type: 'pie',
                    data: {
                        labels: this.analytics.branch_distribution.labels,
                        datasets: [{
                            data: this.analytics.branch_distribution.data,
                            backgroundColor: colors.slice(0, this.analytics.branch_distribution.labels.length),
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } }
                        }
                    }
                });
            }

            // 4. Monthly Trends Line Chart
            const trendCtx = document.getElementById('trendChart');
            if (trendCtx && this.analytics.monthly_trends.labels.length) {
                this.charts.trend = new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: this.analytics.monthly_trends.labels,
                        datasets: [{
                            label: 'Applications',
                            data: this.analytics.monthly_trends.data,
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#6366f1',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false } },
                            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } }
                        }
                    }
                });
            }
        },
        async downloadReport() {
            this.downloading = true;
            try {
                const res = await API.get('/admin/report/pdf', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'placement_report.pdf';
                a.click();
                window.URL.revokeObjectURL(url);
                showToast('Report downloaded!');
            } catch (err) {
                showToast('Failed to download report', 'error');
            } finally {
                this.downloading = false;
            }
        }
    },
    template: `
    <div class="container py-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h2 class="fw-bold mb-1"><i class="bi bi-speedometer2 me-2 text-primary"></i>Admin Dashboard</h2>
                <p class="text-muted mb-0">Overview of placement portal activity</p>
            </div>
            <button class="btn btn-outline-primary" @click="downloadReport" :disabled="downloading">
                <span v-if="downloading" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-file-earmark-pdf me-1"></i>
                {{ downloading ? 'Generating...' : 'Download Report' }}
            </button>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="stats">
            <!-- Stat Cards -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3" v-for="(card, i) in [
                    { label: 'Students', value: stats.total_students, icon: 'bi-people-fill', color: 'primary' },
                    { label: 'Companies', value: stats.total_companies, icon: 'bi-building-fill', color: 'success' },
                    { label: 'Drives', value: stats.total_drives, icon: 'bi-briefcase-fill', color: 'warning' },
                    { label: 'Applications', value: stats.total_applications, icon: 'bi-file-earmark-text-fill', color: 'info' }
                ]" :key="i">
                    <div class="card stat-card border-0 shadow-sm h-100">
                        <div class="card-body d-flex align-items-center">
                            <div :class="'stat-icon bg-' + card.color + '-subtle text-' + card.color + ' me-3'">
                                <i :class="'bi ' + card.icon + ' fs-4'"></i>
                            </div>
                            <div>
                                <h3 class="fw-bold mb-0">{{ card.value }}</h3>
                                <small class="text-muted">{{ card.label }}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Placement Rate Badge -->
            <div class="row g-3 mb-4" v-if="analytics">
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm text-center">
                        <div class="card-body py-4">
                            <h6 class="fw-semibold text-muted mb-2">Placement Rate</h6>
                            <h2 class="fw-bold mb-0" :class="analytics.placement_rate >= 50 ? 'text-success' : 'text-warning'">
                                {{ analytics.placement_rate }}%
                            </h2>
                            <small class="text-muted">of applicants placed</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm text-center">
                        <div class="card-body py-4">
                            <h6 class="fw-semibold text-muted mb-2">Selected Students</h6>
                            <h2 class="fw-bold text-success mb-0">{{ stats.total_selected }}</h2>
                            <small class="text-muted">out of {{ stats.total_applications }} applications</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm text-center">
                        <div class="card-body py-4">
                            <h6 class="fw-semibold text-muted mb-2">Pending Approvals</h6>
                            <h2 class="fw-bold text-warning mb-0">{{ stats.pending_companies + stats.pending_drives }}</h2>
                            <small class="text-muted">{{ stats.pending_companies }} companies, {{ stats.pending_drives }} drives</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row 1 -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <h6 class="fw-semibold mb-3"><i class="bi bi-pie-chart me-2 text-primary"></i>Application Status</h6>
                            <canvas id="statusChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <h6 class="fw-semibold mb-3"><i class="bi bi-building me-2 text-primary"></i>Top Recruiting Companies</h6>
                            <canvas id="companiesChart" height="250"></canvas>
                            <p v-if="!analytics || !analytics.top_companies.labels.length" class="text-center text-muted py-4">No application data yet</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row 2 -->
            <div class="row g-3 mb-4">
                <div class="col-md-5">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <h6 class="fw-semibold mb-3"><i class="bi bi-people me-2 text-success"></i>Students by Branch</h6>
                            <canvas id="branchChart" height="250"></canvas>
                            <p v-if="!analytics || !analytics.branch_distribution.labels.length" class="text-center text-muted py-4">No student data yet</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <h6 class="fw-semibold mb-3"><i class="bi bi-graph-up me-2 text-info"></i>Monthly Application Trends</h6>
                            <canvas id="trendChart" height="250"></canvas>
                            <p v-if="!analytics || !analytics.monthly_trends.labels.length" class="text-center text-muted py-4">No trend data yet</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pending Actions -->
            <div class="row g-3">
                <div class="col-md-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="fw-semibold mb-3"><i class="bi bi-bell me-2 text-warning"></i>Pending Actions</h6>
                            <div class="list-group list-group-flush">
                                <a href="#/admin/companies" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-building me-2 text-warning"></i>Companies pending approval</span>
                                    <span class="badge bg-warning rounded-pill">{{ stats.pending_companies }}</span>
                                </a>
                                <a href="#/admin/drives" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-briefcase me-2 text-info"></i>Drives pending approval</span>
                                    <span class="badge bg-info rounded-pill">{{ stats.pending_drives }}</span>
                                </a>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-check-circle me-2 text-success"></i>Approved companies</span>
                                    <span class="badge bg-success rounded-pill">{{ stats.approved_companies }}</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-check-circle me-2 text-success"></i>Approved drives</span>
                                    <span class="badge bg-success rounded-pill">{{ stats.approved_drives }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
