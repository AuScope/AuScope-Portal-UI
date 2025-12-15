import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GetCapsService } from './get-caps.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GetCapsService', () => {

  beforeEach(() => TestBed.configureTestingModule({
    imports: [],
    providers: [GetCapsService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}));

  it('should be created', () => {
    const service: GetCapsService = TestBed.inject(GetCapsService);
    expect(service).toBeTruthy();
   });
});
