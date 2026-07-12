import { HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { DomainException } from '@iranianoralhistory/shared-contracts';

function buildMockHost(mockResponse: object) {
  return {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  };
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
  });

  it('responds with HTTP 400 Bad Request', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const host = buildMockHost(mockResponse);

    filter.catch(new DomainException('Invalid value'), host as any);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('includes the exception message in the response body', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const host = buildMockHost(mockResponse);

    filter.catch(new DomainException('VimeoId must be numeric'), host as any);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'VimeoId must be numeric',
        error: 'Bad Request',
      }),
    );
  });

  it('always sets statusCode to 400 in the body regardless of the message', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const host = buildMockHost(mockResponse);

    filter.catch(new DomainException('Any domain error'), host as any);

    const body = mockJson.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
  });
});
