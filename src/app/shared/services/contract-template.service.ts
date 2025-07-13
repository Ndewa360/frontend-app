import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ContractTemplateModel,
  CreateContractTemplateDTO,
  UpdateContractTemplateDTO,
  DuplicateContractTemplateDTO,
  ContractTemplateFilterDTO,
  UploadTemplateContentDTO,
  PreviewContractTemplateDTO,
  AssignTemplateToPropertyDTO,
  ContractTemplateListResponse,
  ContractTemplateStatsDTO,
  ContractTemplateWithPermissions
} from '../models/contract-template.model';

@Injectable({
  providedIn: 'root'
})
export class ContractTemplateService {
  private readonly apiUrl = `${environment.apiUrl}/contract-templates`;
  
  // State management
  private templatesSubject = new BehaviorSubject<ContractTemplateModel[]>([]);
  private currentTemplateSubject = new BehaviorSubject<ContractTemplateModel | null>(null);
  private statsSubject = new BehaviorSubject<ContractTemplateStatsDTO | null>(null);

  // Observables publics
  public templates$ = this.templatesSubject.asObservable();
  public currentTemplate$ = this.currentTemplateSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau modèle de contrat
   */
  createTemplate(createDto: CreateContractTemplateDTO): Observable<ContractTemplateModel> {
    return this.http.post<ContractTemplateModel>(this.apiUrl, createDto).pipe(
      tap(template => {
        const currentTemplates = this.templatesSubject.value;
        this.templatesSubject.next([template, ...currentTemplates]);
      })
    );
  }

  /**
   * Dupliquer un modèle existant
   */
  duplicateTemplate(duplicateDto: DuplicateContractTemplateDTO): Observable<ContractTemplateModel> {
    return this.http.post<ContractTemplateModel>(`${this.apiUrl}/duplicate`, duplicateDto).pipe(
      tap(template => {
        const currentTemplates = this.templatesSubject.value;
        this.templatesSubject.next([template, ...currentTemplates]);
      })
    );
  }

  /**
   * Obtenir tous les modèles avec filtres
   */
  getTemplates(filters?: ContractTemplateFilterDTO): Observable<ContractTemplateListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ContractTemplateFilterDTO];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ContractTemplateListResponse>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.templatesSubject.next(response.templates);
      })
    );
  }

  /**
   * Obtenir un modèle par ID
   */
  getTemplateById(templateId: string): Observable<ContractTemplateModel> {
    console.log('Fetching template by ID:', templateId);
    console.log('API URL:', `${this.apiUrl}/${templateId}`);

    return this.http.get<ContractTemplateModel>(`${this.apiUrl}/${templateId}`).pipe(
      tap(template => {
        console.log('Template fetched:', template);
        this.currentTemplateSubject.next(template);
      }),
      catchError(error => {
        console.error('Error fetching template:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        throw error;
      })
    );
  }

  /**
   * Obtenir le contenu d'un modèle
   */
  getTemplateContent(templateId: string): Observable<{ content: string }> {
    console.log('Fetching template content for ID:', templateId);
    console.log('API URL:', `${this.apiUrl}/${templateId}/content`);

    return this.http.get<{ content: string }>(`${this.apiUrl}/${templateId}/content`).pipe(
      tap(response => {
        console.log('Template content response:', response);
      }),
      catchError(error => {
        console.error('Error fetching template content:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        throw error;
      })
    );
  }

  /**
   * Mettre à jour un modèle
   */
  updateTemplate(templateId: string, updateDto: UpdateContractTemplateDTO): Observable<ContractTemplateModel> {
    return this.http.put<ContractTemplateModel>(`${this.apiUrl}/${templateId}`, updateDto).pipe(
      tap(updatedTemplate => {
        // Mettre à jour la liste
        const currentTemplates = this.templatesSubject.value;
        const index = currentTemplates.findIndex(t => t._id === templateId);
        if (index !== -1) {
          currentTemplates[index] = updatedTemplate;
          this.templatesSubject.next([...currentTemplates]);
        }
        
        // Mettre à jour le template courant si c'est le même
        if (this.currentTemplateSubject.value?._id === templateId) {
          this.currentTemplateSubject.next(updatedTemplate);
        }
      })
    );
  }

  /**
   * Uploader le contenu d'un modèle
   */
  uploadTemplateContent(templateId: string, uploadDto: UploadTemplateContentDTO): Observable<ContractTemplateModel> {
    return this.http.put<ContractTemplateModel>(`${this.apiUrl}/${templateId}/content`, uploadDto).pipe(
      tap(updatedTemplate => {
        // Mettre à jour la liste et le template courant
        this.updateTemplateInState(updatedTemplate);
      })
    );
  }

  /**
   * Définir un modèle comme par défaut
   */
  setAsDefault(templateId: string): Observable<ContractTemplateModel> {
    return this.http.put<ContractTemplateModel>(`${this.apiUrl}/${templateId}/set-default`, {}).pipe(
      tap(updatedTemplate => {
        // Mettre à jour tous les templates (retirer le statut par défaut des autres)
        const currentTemplates = this.templatesSubject.value.map(t => ({
          ...t,
          isDefault: t._id === templateId
        }));
        this.templatesSubject.next(currentTemplates);
        
        if (this.currentTemplateSubject.value?._id === templateId) {
          this.currentTemplateSubject.next(updatedTemplate);
        }
      })
    );
  }

  /**
   * Supprimer un modèle
   */
  deleteTemplate(templateId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${templateId}`).pipe(
      tap(() => {
        // Retirer de la liste
        const currentTemplates = this.templatesSubject.value.filter(t => t._id !== templateId);
        this.templatesSubject.next(currentTemplates);
        
        // Nettoyer le template courant si c'est le même
        if (this.currentTemplateSubject.value?._id === templateId) {
          this.currentTemplateSubject.next(null);
        }
      })
    );
  }



  /**
   * Obtenir les statistiques des modèles
   */
  getTemplateStats(): Observable<ContractTemplateStatsDTO> {
    return this.http.get<ContractTemplateStatsDTO>(`${this.apiUrl}/stats/overview`).pipe(
      tap(stats => {
        this.statsSubject.next(stats);
      })
    );
  }

  /**
   * Rechercher des modèles
   */
  searchTemplates(searchTerm: string): Observable<ContractTemplateModel[]> {
    return this.http.get<ContractTemplateModel[]>(`${this.apiUrl}/search/${encodeURIComponent(searchTerm)}`);
  }

  /**
   * Prévisualiser un modèle
   */
  previewTemplate(previewDto: PreviewContractTemplateDTO): Observable<{ preview: string }> {
    return this.http.post<{ preview: string }>(`${this.apiUrl}/preview`, previewDto);
  }

  /**
   * Uploader un fichier de modèle
   */
  uploadTemplateFile(file: File): Observable<{ templateUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ templateUrl: string; fileName: string }>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Assigner un modèle à une propriété
   */
  assignTemplateToProperty(assignDto: AssignTemplateToPropertyDTO): Observable<void> {
    // Cette méthode devra être implémentée dans le service des propriétés
    // ou créer un endpoint spécifique pour l'assignation
    return this.http.post<void>(`${this.apiUrl}/assign-to-property`, assignDto);
  }

  /**
   * Obtenir les modèles avec permissions
   */
  getTemplatesWithPermissions(filters?: ContractTemplateFilterDTO): Observable<ContractTemplateWithPermissions[]> {
    return this.getTemplates(filters).pipe(
      map(response => response.templates.map(template => this.addPermissions(template)))
    );
  }

  /**
   * Nettoyer l'état
   */
  clearState(): void {
    this.templatesSubject.next([]);
    this.currentTemplateSubject.next(null);
    this.statsSubject.next(null);
  }

  /**
   * Méthodes utilitaires privées
   */
  private updateTemplateInState(updatedTemplate: ContractTemplateModel): void {
    const currentTemplates = this.templatesSubject.value;
    const index = currentTemplates.findIndex(t => t._id === updatedTemplate._id);
    if (index !== -1) {
      currentTemplates[index] = updatedTemplate;
      this.templatesSubject.next([...currentTemplates]);
    }
    
    if (this.currentTemplateSubject.value?._id === updatedTemplate._id) {
      this.currentTemplateSubject.next(updatedTemplate);
    }
  }

  /**
   * Obtenir le template par défaut depuis Google Cloud Storage
   */
  getDefaultTemplate(): Observable<ContractTemplateModel> {
    return this.http.get<ContractTemplateModel>(`${this.apiUrl}/default`).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement du template par défaut:', error);
        throw error;
      })
    );
  }





  /**
   * Sauvegarder le contenu d'un template dans Google Cloud Storage
   */
  saveTemplateContent(templateId: string, content: string): Observable<ContractTemplateModel> {
    const uploadDto: UploadTemplateContentDTO = { content };
    return this.http.put<ContractTemplateModel>(`${this.apiUrl}/${templateId}/content`, uploadDto).pipe(
      tap(updatedTemplate => {
        this.updateTemplateInState(updatedTemplate);
      }),
      catchError(error => {
        console.error('Erreur lors de la sauvegarde:', error);
        throw error;
      })
    );
  }

  /**
   * Réindexer les templates utilisateur depuis Google Cloud Storage
   */
  reindexUserTemplates(): Observable<{ indexed: number; updated: number; errors: string[] }> {
    return this.http.post<{ indexed: number; updated: number; errors: string[] }>(`${this.apiUrl}/reindex`, {}).pipe(
      catchError(error => {
        console.error('Erreur lors de la réindexation:', error);
        throw error;
      })
    );
  }

  private addPermissions(template: ContractTemplateModel): ContractTemplateWithPermissions {
    // Logique pour déterminer les permissions selon le type et le propriétaire
    const permissions = {
      canEdit: !template.isSystemDefault,
      canDelete: !template.isSystemDefault && !template.isDefault,
      canDuplicate: true,
      canSetAsDefault: !template.isSystemDefault,
      canShare: true
    };

    return { ...template, permissions };
  }
}
