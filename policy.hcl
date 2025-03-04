path "secret/data/*" {
  capabilities = ["read", "create", "update", "delete", "list"]
}

path "transit/keys/*" {
  capabilities = ["read", "create", "update", "delete", "list"]
}