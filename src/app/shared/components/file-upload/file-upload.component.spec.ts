import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await configureSmokeTest(FileUploadComponent, { standalone: true });
    fixture = TestBed.createComponent(FileUploadComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
