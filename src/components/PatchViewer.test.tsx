import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { PatchViewer } from './PatchViewer';

const samplePatch = `From: Test User <test@example.com>
Date: Mon, 7 Jul 2025 20:00:00 +0000
Subject: [PATCH] Fix bug in authentication

---
 src/auth.js | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)

diff --git a/src/auth.js b/src/auth.js
index 1234567..abcdefg 100644
--- a/src/auth.js
+++ b/src/auth.js
@@ -10,8 +10,8 @@ function authenticate(user) {
   if (!user) {
     return false;
   }
-  return user.isValid;
+  return user.isValid && user.isActive;
 }

 module.exports = { authenticate };
--
2.39.0`;

describe('PatchViewer', () => {
  it('renders patch with diff view by default', () => {
    render(
      <TestApp>
        <PatchViewer patchContent={samplePatch} />
      </TestApp>
    );

    expect(screen.getByText('[PATCH] Fix bug in authentication')).toBeInTheDocument();
    expect(screen.getByText('1 file changed')).toBeInTheDocument();
    expect(screen.getByText('src/auth.js')).toBeInTheDocument();
    expect(screen.getByText('Diff')).toBeInTheDocument();
    expect(screen.getByText('Raw')).toBeInTheDocument();
  });

  it('shows file statistics correctly', () => {
    render(
      <TestApp>
        <PatchViewer patchContent={samplePatch} />
      </TestApp>
    );

    // Should show additions and deletions in the stats
    expect(screen.getAllByText('+1')).toHaveLength(2); // Overall stats and file stats
    expect(screen.getAllByText('-2')).toHaveLength(2); // Overall stats and file stats
  });

  it('handles empty patch content', () => {
    render(
      <TestApp>
        <PatchViewer patchContent="" />
      </TestApp>
    );

    expect(screen.getByText('No file changes detected in this patch')).toBeInTheDocument();
  });
});