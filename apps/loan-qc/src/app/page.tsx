"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Minimize, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinHeader } from '@/components/layout/MinHeader';
import { ObjectHeader } from '@/components/layout/ObjectHeader';
import { SplitViewLayout } from '@/components/layout/SplitViewLayout';
import { ValidationChecklist } from '@/components/validation/ValidationChecklist';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { DocumentToggle } from '@/components/document/DocumentToggle';
import { useValidationState } from '@/hooks/useValidationState';
import { useDocumentView } from '@/hooks/useDocumentView';
import { mockDocuments } from '@/lib/validation-data';

export default function LoanQCPage() {
  const { items, expandedItemId, setExpandedItemId, updateHumanEvaluation, addComment } = useValidationState();
  const { viewMode, activeDocument, enterImmersiveMode, exitImmersiveMode, switchDocument } =
    useDocumentView();

  const [doc1, doc2] = mockDocuments;

  // Extract highlights for each document from validation items
  const doc1Highlights = items.flatMap(
    (item) =>
      item.documentHighlights?.filter((h) => h.documentId === doc1.id) || [],
  );
  const doc2Highlights = items.flatMap(
    (item) =>
      item.documentHighlights?.filter((h) => h.documentId === doc2.id) || [],
  );

  const isImmersive = viewMode === 'immersive-left' || viewMode === 'immersive-right';
  const isSplit = viewMode === 'split';

  return (
    <div className="h-screen w-screen flex flex-col">
      <MinHeader />
      <ObjectHeader />
      <div className="flex-1 overflow-hidden">
        <SplitViewLayout
          validationPanel={
            <ValidationChecklist
              items={items}
              onUpdateEvaluation={updateHumanEvaluation}
              onAddComment={addComment}
              expandedItemId={expandedItemId}
              onItemClick={setExpandedItemId}
            />
          }
          documentArea={
            <motion.div
              className="h-full relative"
              animate={{
                backgroundColor: isImmersive ? 'hsl(var(--secondary))' : 'transparent',
                padding: isImmersive ? '32px' : '0px'
              }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Document header buttons in split view */}
              <AnimatePresence mode="wait">
                {isSplit && (
                  <motion.div
                    key="split-buttons"
                    className="absolute inset-0 pointer-events-none z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 2 } }}
                  >
                    <div className="relative h-full w-full">
                      {/* Left button */}
                      <motion.div
                        className="absolute pointer-events-auto"
                        style={{ left: '25%', top: '.5rem' }}
                        initial={{ opacity: 1, scale: 1, x: '-50%' }}
                        exit={{
                          opacity: 0,
                          scale: 0.8,
                          x: 'calc(25% - 50%)',
                          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                        }}
                      >
                        <Button
                          variant="secondary"
                          className="shadow-md"
                          onClick={() => enterImmersiveMode(doc1.id)}
                          size="default"
                        >
                          {doc1.name}
                          <Maximize className="ml-4 h-4 w-4" />
                        </Button>
                      </motion.div>

                      {/* Right button */}
                      <motion.div
                        className="absolute pointer-events-auto"
                        style={{ left: '75%', top: '.5rem' }}
                        initial={{ opacity: 1, scale: 1, x: '-50%' }}
                        exit={{
                          opacity: 0,
                          scale: 0.8,
                          x: 'calc(-25% - 50%)',
                          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                        }}
                      >
                        <Button
                          variant="secondary"
                          className="shadow-md"
                          onClick={() => enterImmersiveMode(doc2.id)}
                          size="default"
                        >
                          {doc2.name}
                          <Maximize className="ml-4 h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Immersive controls */}
              <AnimatePresence mode="wait">
                {isImmersive && (
                  <motion.div
                    key="immersive-controls"
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                    initial={{ opacity: 0, scale: 1, y: -4 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.15 }
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.2 } }}
                  >
                    <DocumentToggle
                      documents={mockDocuments}
                      activeDocumentId={activeDocument || doc1.id}
                      onDocumentChange={switchDocument}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isImmersive && (
                  <motion.div
                    className="absolute top-4 right-4 z-20"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.3, delay: 0.15 }
                    }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.6 } }}
                  >
                    <Button
                      variant="secondary"
                      className="shadow-md"
                      onClick={exitImmersiveMode}
                    >
                      Split view
                      <Minimize className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Documents container */}
              <div className="h-full relative">
                {isSplit ? (
                  <SplitViewLayout
                    leftDocument={
                      <div className="h-full p-2">
                        <DocumentViewer
                          document={doc1}
                          highlights={doc1Highlights}
                        />
                      </div>
                    }
                    rightDocument={
                      <div className="h-full p-2">
                        <DocumentViewer
                          document={doc2}
                          highlights={doc2Highlights}
                        />
                      </div>
                    }
                  />
                ) : (
                  <div className="h-full flex">
                    {/* Left document */}
                    <motion.div
                      className="relative"
                      initial={{ width: '50%', opacity: 1, scale: 1 }}
                      animate={{
                        width: activeDocument === doc1.id ? '100%' : '0%',
                        opacity: activeDocument === doc1.id ? 1 : 0,
                        scale: activeDocument === doc1.id ? 1 : 0.95,
                      }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        overflow: 'hidden',
                        transformOrigin: 'left center'
                      }}
                    >
                      <DocumentViewer
                        document={doc1}
                        highlights={doc1Highlights}
                      />
                    </motion.div>

                    {/* Right document */}
                    <motion.div
                      className="relative"
                      initial={{ width: '50%', opacity: 1, scale: 1 }}
                      animate={{
                        width: activeDocument === doc2.id ? '100%' : '0%',
                        opacity: activeDocument === doc2.id ? 1 : 0,
                        scale: activeDocument === doc2.id ? 1 : 0.95,
                      }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        overflow: 'hidden',
                        transformOrigin: 'right center'
                      }}
                    >
                      <DocumentViewer
                        document={doc2}
                        highlights={doc2Highlights}
                      />
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          }
        />
      </div>
    </div>
  );
}
