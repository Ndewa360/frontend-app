import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit,AfterViewInit, OnChanges {
 
  @ViewChild("dropzone") dropzoneHtml:ElementRef;
  @ViewChild("inputDropzone") inputDropzone:ElementRef;
  @Input() isMultiple:boolean=false;
  @Input() acceptedFile = "IMAGE, VIDEO, PANORAMA IMAGE"
  @Input() acceptedFileType ="image/*,video/*,audio/*,.pdf,.doc,.docx,.pptx,.xls,.xlsx"
  @Input() shouldResetFiles:boolean=false
  
  @Output() uploadFileEvent:EventEmitter<File[]>=new EventEmitter<File[]>();
  files:File[]=[]
  fileDragging: null;
  fileDropping: null;
  constructor(@Inject(DOCUMENT) private document: Document, private sanitizer: DomSanitizer) {}
  
  ngAfterViewInit(): void { 
    // this.dropzoneHtml.nativeElement.      
  }

  ngOnInit(): void {}
  ngOnChanges(changes): void {
    if(changes.shouldResetFiles.currentValue)
    {
      this.files=[]
      this.uploadFileEvent.emit(this.files)
    }
  }

  uploadFile(event: any)
  {
    this.addFiles(this.isMultiple?event.target.files:[event.target.files[0]])
  }

        
  humanFileSize(size) {
      const i = Math.floor(Math.log(size) / Math.log(1024));
      return `${(size / Math.pow(1024, i)).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`;
  }
  remove(event,index) {
    event.preventDefault();
    event.stopPropagation();
    this.files.splice(index, 1);
    this.uploadFileEvent.emit(this.files)
  }

  startDrag($event){}

  dropFile(event)
  {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('border-gray-800');  
    this.addFiles(this.isMultiple?event.dataTransfer.files: [event.dataTransfer.files[0]]);
  }


  addFiles(files) {
    if(this.isMultiple) this.files = [...this.files,...files];
    else this.files = [...files]

    this.uploadFileEvent.emit(this.files)
  }
  


  dragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.add('border-gray-800');
  }

  dragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('border-gray-800');
  }


  clickToFile()
  {
    this.inputDropzone.nativeElement.click();
  }

  loadFile(file) {    
      const preview:any = document.querySelectorAll(".preview");
      const blobUrl = this.sanitizer.bypassSecurityTrustUrl(this.document.defaultView.URL.createObjectURL(file));

      preview.forEach(elem => {
          elem.onload = () => {
            this.document.defaultView.URL.revokeObjectURL(elem.src);
          };
      });
      return blobUrl;
  }

  

}
