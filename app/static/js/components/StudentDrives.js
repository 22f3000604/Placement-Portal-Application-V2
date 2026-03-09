const StudentDrivesComponent = {
    data() {
        return { drives: [], search: '', eligibleOnly: false, loading: true, selectedDrive: null, resumeFile: null, resumeError: '', applying: false };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const params = {};
                if (this.search) params.search = this.search;
                if (this.eligibleOnly) params.eligible = 'true';
                const res = await API.get('/student/drives', { params });
                this.drives = res.data;
            } catch (err) { showToast('Failed to load drives', 'error'); }
            finally { this.loading = false; }
        },
        openApplyModal(drive) {
            this.selectedDrive = drive;
            this.resumeFile = null;
            const modal = new bootstrap.Modal(document.getElementById('applyModal'));
            modal.show();
        },
        onFileChange(e) {
            const file = e.target.files[0] || null;
            this.resumeError = '';
            if (file) {
                const typeErr = Validators.fileType(file, ['pdf', 'doc', 'docx']);
                if (typeErr) { this.resumeError = typeErr; this.resumeFile = null; return; }
                const sizeErr = Validators.maxFileSize(file, 5);
                if (sizeErr) { this.resumeError = sizeErr; this.resumeFile = null; return; }
            }
            this.resumeFile = file;
        },
        async submitApplication() {
            if (!this.selectedDrive) return;
            if (!this.resumeFile) {
                this.resumeError = 'Please attach your resume (PDF, DOC, or DOCX, max 5MB)';
                return;
            }
            this.applying = true;
            try {
                const formData = new FormData();
                formData.append('resume', this.resumeFile);
                await API.post('/student/drives/' + this.selectedDrive.id + '/apply', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('Application submitted successfully!');
                bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
                this.load();
            } catch (err) {
                showToast(err.response?.data?.error || 'Application failed', 'error');
            } finally {
                this.applying = false;
            }
        },
        formatDate(d) {
            return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        }
    },
    template: `
    <div class="container py-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-briefcase me-2 text-primary"></i>Browse Placement Drives</h2>
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-md-7">
                        <input type="text" class="form-control" v-model="search" @input="load" placeholder="Search by title or description...">
                    </div>
                    <div class="col-md-3">
                        <div class="form-check form-switch mt-2">
                            <input class="form-check-input" type="checkbox" v-model="eligibleOnly" @change="load" id="eligibleToggle">
                            <label class="form-check-label fw-medium" for="eligibleToggle">Show eligible only</label>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" @click="search=''; eligibleOnly=false; load()"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="drives.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-briefcase fs-1"></i><p class="mt-2">No drives available</p>
        </div>
        <div v-else class="row g-3">
            <div class="col-md-6" v-for="d in drives" :key="d.id">
                <div class="card border-0 shadow-sm h-100 drive-card" :class="{ 'opacity-75': !d.is_eligible || d.deadline_passed }">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold mb-0">{{ d.job_title }}</h5>
                            <span v-if="d.already_applied" class="badge bg-info rounded-pill">Applied</span>
                            <span v-else-if="d.deadline_passed" class="badge bg-secondary rounded-pill">Closed</span>
                        </div>
                        <p class="text-primary fw-medium mb-1"><i class="bi bi-building me-1"></i>{{ d.company_name }}</p>
                        <p class="text-muted small mb-3" style="max-height:50px;overflow:hidden">{{ d.job_description }}</p>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <span class="badge bg-light text-dark"><i class="bi bi-currency-rupee"></i>{{ d.package_lpa || '—' }} LPA</span>
                            <span class="badge bg-light text-dark"><i class="bi bi-geo-alt me-1"></i>{{ d.location || 'Remote' }}</span>
                            <span class="badge bg-light text-dark"><i class="bi bi-calendar me-1"></i>{{ formatDate(d.application_deadline) }}</span>
                            <span class="badge bg-light text-dark"><i class="bi bi-bar-chart me-1"></i>Min CGPA: {{ d.eligibility_cgpa || 'Any' }}</span>
                        </div>
                        <div v-if="!d.is_eligible && d.ineligibility_reasons.length" class="alert alert-warning py-1 px-2 small mb-2">
                            <i class="bi bi-exclamation-triangle me-1"></i>{{ d.ineligibility_reasons.join(', ') }}
                        </div>
                        <button v-if="!d.already_applied && !d.deadline_passed && d.is_eligible"
                                class="btn btn-primary btn-sm w-100" @click="openApplyModal(d)">
                            <i class="bi bi-send me-1"></i>Apply Now
                        </button>
                        <button v-else-if="d.already_applied" class="btn btn-outline-info btn-sm w-100" disabled>
                            <i class="bi bi-check-circle me-1"></i>Already Applied
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Apply Modal -->
        <div class="modal fade" id="applyModal" tabindex="-1" aria-labelledby="applyModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="applyModalLabel">
                            <i class="bi bi-file-earmark-arrow-up me-2"></i>Apply to {{ selectedDrive?.job_title }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">Please attach your resume to complete your application.</p>
                        <div class="mb-3">
                            <label for="resumeInput" class="form-label fw-semibold">
                                <i class="bi bi-paperclip me-1"></i>Resume (PDF, DOC, DOCX)
                            </label>
                            <input class="form-control" type="file" id="resumeInput" accept=".pdf,.doc,.docx" @change="onFileChange">
                            <div class="form-text">Maximum file size: 5MB</div>
                        </div>
                        <div v-if="resumeError" class="alert alert-danger py-2 px-3 small mb-2">
                            <i class="bi bi-exclamation-circle me-1"></i>{{ resumeError }}
                        </div>
                        <div v-if="resumeFile" class="alert alert-success py-2 px-3 small mb-0">
                            <i class="bi bi-check-circle me-1"></i>Selected: <strong>{{ resumeFile.name }}</strong> ({{ (resumeFile.size / 1024).toFixed(1) }} KB)
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="submitApplication" :disabled="applying || !resumeFile">
                            <span v-if="applying" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-send me-1"></i>
                            {{ applying ? 'Submitting...' : 'Submit Application' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
