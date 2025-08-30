import { errorReturn } from './errorReturn'

// parses JSON as request.content or returns a 400 error
export const withJsonContent = async (request) => {
    try {
        request.content = await request.json()
    } catch (err) {
        return errorReturn(err, 400);
    }
}