#!/bin/bash
set -e

echo "📦 Verifying apollo-wind package contents..."
echo ""

# 1. Test pack (dry-run)
echo "1. Running yarn pack --dry-run..."
yarn pack --dry-run
echo ""

# 2. Verify CSS exists
echo "2. Verifying CSS file exists..."
if [ ! -f dist/index.css ]; then
  echo "❌ ERROR: dist/index.css missing"
  exit 1
fi
echo "✅ dist/index.css exists"
echo ""

# 3. Verify CSS size
echo "3. Verifying CSS file size..."
SIZE=$(wc -c < dist/index.css)
MIN_SIZE=120000  # 120KB minimum
MAX_SIZE=150000  # 150KB maximum

if [ $SIZE -lt $MIN_SIZE ]; then
  echo "❌ ERROR: CSS file too small: $SIZE bytes (expected >$MIN_SIZE)"
  exit 1
fi

if [ $SIZE -gt $MAX_SIZE ]; then
  echo "⚠️ WARNING: CSS file too large: $SIZE bytes (expected <$MAX_SIZE)"
  echo "This may indicate a regression. Please investigate."
fi

echo "✅ CSS file size OK: $SIZE bytes (~$(($SIZE / 1024)) KB)"
echo ""

# 4. Verify gzipped size
echo "4. Verifying gzipped size..."
GZIP_SIZE=$(gzip -c dist/index.css | wc -c)
MAX_GZIP=25000  # 25KB max gzipped

if [ $GZIP_SIZE -gt $MAX_GZIP ]; then
  echo "❌ ERROR: Gzipped size too large: $GZIP_SIZE bytes (max $MAX_GZIP)"
  exit 1
fi

echo "✅ Gzipped size OK: $GZIP_SIZE bytes (~$(($GZIP_SIZE / 1024)) KB)"
echo ""

# 5. Verify TypeScript outputs exist
echo "5. Verifying TypeScript outputs..."
for file in dist/index.js dist/index.mjs dist/index.d.ts dist/index.d.mts; do
  if [ ! -f $file ]; then
    echo "⚠️ WARNING: $file missing (optional)"
  else
    echo "✅ $file exists"
  fi
done
echo ""

# 6. Test import resolution
echo "6. Testing import resolution..."
node -e "
try {
  const cssPath = require.resolve('@uipath/apollo-wind');
  console.log('✅ CSS import resolves to:', cssPath);

  const utilsPath = require.resolve('@uipath/apollo-wind/utils');
  console.log('✅ Utils import resolves to:', utilsPath);
} catch(e) {
  console.error('❌ Import resolution failed:', e.message);
  process.exit(1);
}
"
echo ""

# 7. Verify CSS content
echo "7. Verifying CSS content..."
FIRST_LINE=$(head -1 dist/index.css)
if ! echo "$FIRST_LINE" | grep -qE "(^/\*|^@)"; then
  echo "❌ ERROR: CSS file doesn't start with comment or @ rule"
  exit 1
fi
echo "✅ CSS file structure looks correct (starts with: ${FIRST_LINE:0:50}...)"
echo ""

echo "✅ All package verification checks passed!"
