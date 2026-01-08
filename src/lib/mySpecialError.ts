import { APIError } from 'payload'
class MySpecialError extends APIError {
  constructor(message: string) {
    super(message, 400, undefined, true)
  }
}

export default MySpecialError
