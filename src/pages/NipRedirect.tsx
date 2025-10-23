import { useParams, Navigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';

export default function NipRedirect() {
  const { id } = useParams<{ id: string }>();
  
  useSeoMeta({
    title: 'Redirecting... | NostrHub',
    description: 'Redirecting to the requested content on NostrHub.',
  });
  
  return <Navigate to={`/${id}`} replace />;
}