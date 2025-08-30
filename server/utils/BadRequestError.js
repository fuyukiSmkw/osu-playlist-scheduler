export class BadRequestError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = 'BadRequestError';
        this.status = status;
    }
}