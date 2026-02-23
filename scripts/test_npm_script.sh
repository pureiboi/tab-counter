npm run --json | jq -r 'with_entries(select(.key | test("bump|release|ff|watch") | not)) | keys[]' | while read script; do npm run "$script"; done
