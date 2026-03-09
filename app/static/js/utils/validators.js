/**
 * Frontend Validation Utility
 * Reusable validators for all form components
 */

const Validators = {
    email(value) {
        if (!value) return 'Email is required';
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(value)) return 'Please enter a valid email address';
        return '';
    },

    password(value, minLength = 6) {
        if (!value) return 'Password is required';
        if (value.length < minLength) return `Password must be at least ${minLength} characters`;
        if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        return '';
    },

    required(value, fieldName) {
        if (!value || (typeof value === 'string' && !value.trim())) return `${fieldName} is required`;
        return '';
    },

    cgpa(value) {
        if (value === '' || value === null || value === undefined) return 'CGPA is required';
        const num = parseFloat(value);
        if (isNaN(num)) return 'CGPA must be a number';
        if (num < 0 || num > 10) return 'CGPA must be between 0 and 10';
        return '';
    },

    phone(value) {
        if (!value) return ''; // phone is optional
        const cleaned = value.replace(/[\s\-()]/g, '');
        if (!/^\+?\d{10,15}$/.test(cleaned)) return 'Please enter a valid phone number (10-15 digits)';
        return '';
    },

    url(value) {
        if (!value) return ''; // optional
        try {
            new URL(value);
            return '';
        } catch {
            return 'Please enter a valid URL (e.g., https://example.com)';
        }
    },

    futureDate(value, fieldName = 'Date') {
        if (!value) return `${fieldName} is required`;
        const d = new Date(value);
        if (isNaN(d.getTime())) return `${fieldName} is not a valid date`;
        if (d <= new Date()) return `${fieldName} must be in the future`;
        return '';
    },

    minLength(value, min, fieldName) {
        if (value && value.length < min) return `${fieldName} must be at least ${min} characters`;
        return '';
    },

    maxFileSize(file, maxMB = 5) {
        if (!file) return 'Please select a file';
        if (file.size > maxMB * 1024 * 1024) return `File size must be less than ${maxMB}MB`;
        return '';
    },

    fileType(file, allowedExts = ['pdf', 'doc', 'docx']) {
        if (!file) return '';
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) return `Allowed formats: ${allowedExts.join(', ').toUpperCase()}`;
        return '';
    },

    packageLpa(value) {
        if (!value) return ''; // optional
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return 'Package must be a positive number';
        if (num > 200) return 'Package seems unrealistic (max 200 LPA)';
        return '';
    }
};

/**
 * Vue mixin for form validation support.
 * Components using this mixin should define a `validationRules` method
 * that returns an object { fieldName: errorMessage }.
 *
 * Usage in component:
 *   mixins: [ValidationMixin],
 *   data() { return { fieldErrors: {} } },
 *   methods: {
 *     validationRules() {
 *       return {
 *         email: Validators.email(this.form.email),
 *         password: Validators.password(this.form.password),
 *       };
 *     }
 *   }
 */
const ValidationMixin = {
    methods: {
        validateForm() {
            if (typeof this.validationRules !== 'function') return true;
            this.fieldErrors = this.validationRules();
            return !Object.values(this.fieldErrors).some(e => e);
        },
        fieldClass(field) {
            if (!this.fieldErrors || !this.fieldErrors[field]) return '';
            return this.fieldErrors[field] ? 'is-invalid' : '';
        },
        clearFieldError(field) {
            if (this.fieldErrors) this.fieldErrors[field] = '';
        }
    }
};
