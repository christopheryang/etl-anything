'use client';

import React, { useState, useEffect } from 'react';
import { X, Folder, Search, Grid, List, Download, Play, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: {
    nodes: Array<{ id: string; type: string; position: { x: number; y: number } }>;
    edges: Array<{ id: string; source: string; target: string }>;
  };
}

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (workflow: any) => void;
}

const CATEGORIES = ['All', 'ETL', 'Analysis', 'Validation', 'Custom'];

export default function TemplateLibrary({ isOpen, onClose, onLoadTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load built-in templates
      const builtinResponse = await fetch('/api/templates/builtin');
      const builtin = await builtinResponse.json();

      // Load user templates
      const userResponse = await fetch('/api/templates');
      const user = await userResponse.json();

      setTemplates([...builtin, ...user]);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fallback: try to load static files
      try {
        const staticFiles = ['simple-etl', 'document-classifier', 'data-validator'];
        const loaded: Template[] = [];
        
        for (const file of staticFiles) {
          try {
            const response = await fetch(`/templates/${file}.json`);
            if (response.ok) {
              loaded.push(await response.json());
            }
          } catch {
            // Skip if file doesn't exist
          }
        }
        
        if (loaded.length > 0) {
          setTemplates(loaded);
        }
      } catch {
        // No templates available
        setTemplates([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (template: Template) => {
    onLoadTemplate(template.workflow);
    onClose();
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex overflow-hidden">
        {/* Left Panel - Template List */}
        <div className="w-3/5 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Template Library
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter & View Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === cat
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Grid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No templates found</div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Folder className="w-4 h-4 text-teal-600" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                      selectedTemplate?.id === template.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {template.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoad(template);
                        }}
                        className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded"
                        title="Load template"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Template Preview */}
        <div className="w-2/5 flex flex-col bg-gray-50 dark:bg-gray-800">
          {selectedTemplate ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTemplate.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedTemplate.category} • {selectedTemplate.workflow.nodes.length} nodes
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nodes Preview */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Workflow Nodes
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.workflow.nodes.map((node) => (
                      <div
                        key={node.id}
                        className="text-xs p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                      >
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {node.id}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 capitalize">
                          {node.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleLoad(selectedTemplate)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Load Template to Canvas
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a template to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
