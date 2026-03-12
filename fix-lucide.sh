#!/bin/bash

FILES=$(grep -r -l -E 'Loader2|ArrowLeft|Calendar|AlertCircle|Plus|FileText|Users|TrendingUp|DollarSign' src/app)

for file in $FILES; do
  if ! grep -q "from 'lucide-react'" "$file"; then
    # Insert after 'use client' or at top
    if grep -q "'use client'" "$file"; then
      sed -i '' "/'use client'/a\\
import { Loader2, ArrowLeft, Calendar, AlertCircle, Plus, FileText, Users, TrendingUp, DollarSign } from 'lucide-react';\\
" "$file"
    else
      sed -i '' '1i\
import { Loader2, ArrowLeft, Calendar, AlertCircle, Plus, FileText, Users, TrendingUp, DollarSign } from "lucide-react";\
' "$file"
    fi
    echo "Added import to $file"
  else
    echo "Already has import: $file"
  fi
done
