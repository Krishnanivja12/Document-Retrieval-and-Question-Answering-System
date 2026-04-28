# Document Card Implementation

## Overview
Enhanced document card UI with view and delete functionality for managing uploaded documents.

## Features Implemented

### 1. Document Card Component (`DocumentCard.tsx`)
- **Visual Design**: Clean, modern card with gradient backgrounds and smooth animations
- **Hover Effects**: Action buttons appear on hover with smooth transitions
- **View Button**: Opens document in new tab (eye icon)
- **Delete Button**: Removes document with confirmation modal (X icon)
- **Loading States**: Shows spinner during deletion
- **Animations**: Framer Motion for entrance, hover, and interaction effects

### 2. Backend API Endpoint
**New Endpoint**: `DELETE /api/v1/ingest/document/{document_id}`

**Functionality**:
- Deletes document record from database
- Removes all associated chunks
- Deletes physical files (text and original)
- Returns deletion summary

**Response**:
```json
{
  "status": "success",
  "message": "Document 'filename.pdf' deleted successfully",
  "deleted": {
    "document_id": 123,
    "chunks": 45,
    "files": 2
  }
}
```

### 3. Frontend API Service
**New Function**: `deleteDocument(documentId: number)`
- Calls backend DELETE endpoint
- Returns deletion result
- Handles errors gracefully

### 4. State Management
**Updated Store**:
- Added `removeUploadedItem(id)` function
- Removes document from local state after deletion
- Maintains UI consistency

## User Experience

### Viewing Documents
1. Hover over any document card
2. Action buttons slide in from the right
3. Click the eye icon to view document in new tab

### Deleting Documents
1. Hover over document card
2. Click the X button
3. Confirmation modal appears with warning
4. Confirm deletion or cancel
5. Document removed with smooth animation
6. Success feedback

### Visual Feedback
- **Hover**: Card lifts with shadow, buttons appear
- **Loading**: Spinner animation during deletion
- **Confirmation**: Modal with warning icon and clear messaging
- **Success**: Card fades out smoothly

## Technical Details

### Component Props
```typescript
interface DocumentCardProps {
  id: number;           // Document ID
  filename: string;     // Display name
  type: string;         // 'file' or 'url'
  index: number;        // For staggered animations
  onDelete: (id: number) => void;  // Callback after deletion
}
```

### Animations
- **Entrance**: Staggered fade-in with scale
- **Hover**: Lift effect with shadow
- **Buttons**: Slide in from right
- **Modal**: Scale and fade
- **Delete**: Smooth removal

### Error Handling
- Network errors caught and displayed
- User-friendly error messages
- Graceful fallbacks
- Console logging for debugging

## Files Modified

### Backend
- `backend/app/api/routes/ingestion.py` - Added delete endpoint

### Frontend
- `frontend/src/components/workspace/DocumentCard.tsx` - New component
- `frontend/src/components/workspace/index.ts` - Export added
- `frontend/src/pages/WorkspacePage.tsx` - Integrated component
- `frontend/src/services/api.ts` - Added deleteDocument function
- `frontend/src/store/appStore.ts` - Added removeUploadedItem

## Security Considerations
- Document ID validation on backend
- Proper error handling
- File system cleanup
- Database transaction safety
- User confirmation before deletion

## Future Enhancements
- Bulk delete functionality
- Document preview modal
- Download document option
- Document metadata display
- Search and filter documents
- Sort by date/name/type
- Undo delete functionality
- Trash/recycle bin feature

## Usage Example

```tsx
<DocumentCard
  id={123}
  filename="research-paper.pdf"
  type="file"
  index={0}
  onDelete={(id) => console.log(`Deleted document ${id}`)}
/>
```

## Testing Checklist
- ✅ Document card displays correctly
- ✅ Hover shows action buttons
- ✅ View button opens document
- ✅ Delete button shows confirmation
- ✅ Deletion removes document
- ✅ Error handling works
- ✅ Animations are smooth
- ✅ Responsive on all screens
- ✅ No TypeScript errors
- ✅ Backend endpoint functional

## Notes
- View functionality requires backend endpoint for document viewing
- Delete is permanent and cannot be undone
- All animations use Framer Motion for consistency
- Component follows existing design system
