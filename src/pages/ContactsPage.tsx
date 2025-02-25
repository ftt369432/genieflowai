import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ContactGrid } from '../components/contacts/ContactGrid';
import { ContactList } from '../components/contacts/ContactList';
import { ContactForm } from '../components/contacts/ContactForm';
import { ContactFilters } from '../components/contacts/ContactFilters';
import { filterContacts } from '../services/contacts/contactManager';
import type { Contact } from '../types';

// Mock contacts data
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Tech Corp',
    tags: ['client', 'tech'],
    lastInteraction: new Date('2024-03-01'),
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    company: 'Design Studio',
    tags: ['vendor', 'design'],
    lastInteraction: new Date('2024-03-05'),
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    company: 'Marketing Inc',
    tags: ['partner', 'marketing'],
    lastInteraction: new Date('2024-03-08'),
  },
];

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [showForm, setShowForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCreateContact = (contactData: Partial<Contact>) => {
    const newContact: Contact = {
      id: String(Date.now()),
      name: contactData.name || '',
      email: contactData.email || '',
      company: contactData.company,
      tags: contactData.tags || [],
      lastInteraction: new Date(),
    };
    setContacts([newContact, ...contacts]);
    setShowForm(false);
  };

  const handleUpdateContact = (contactData: Partial<Contact>) => {
    if (!selectedContact) return;
    setContacts(contacts.map(contact =>
      contact.id === selectedContact.id
        ? { ...contact, ...contactData }
        : contact
    ));
    setSelectedContact(null);
    setShowForm(false);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Get all unique tags from contacts
  const allTags = Array.from(new Set(contacts.flatMap(contact => contact.tags)));

  // Filter contacts based on search query and selected tags
  const filteredContacts = filterContacts(contacts, searchQuery, selectedTags);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600">Manage your contacts and relationships</p>
          </div>
          <button
            onClick={() => {
              setSelectedContact(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Contact
          </button>
        </div>

        <ContactFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          availableTags={allTags}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {showForm && (
        <ContactForm
          onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
          onCancel={() => {
            setShowForm(false);
            setSelectedContact(null);
          }}
          initialData={selectedContact || undefined}
        />
      )}

      {viewMode === 'grid' ? (
        <ContactGrid
          contacts={filteredContacts}
          onSelect={(contact) => {
            setSelectedContact(contact);
            setShowForm(true);
          }}
        />
      ) : (
        <ContactList
          contacts={filteredContacts}
          onSelect={(contact) => {
            setSelectedContact(contact);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}