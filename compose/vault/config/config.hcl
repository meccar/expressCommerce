ui = true

listener "tcp" {
  address = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_disable = 0
  tls_cert_file = "/vault/config/etc/vault.d/client.pem"
  tls_key_file = "/vault/config/etc/vault.d/cert.key"
  tls_disable_client_certs = "true"
}

storage "consul" {
  address = "consul-server1:8500"
  path = "vault/"
  token = "1a2b3c4d-1234-abcd-1234-1a2b3c4d5e6a"
  scheme = "http"
}

api_addr = "https://127.0.0.1:8200"
api_cluster_addr = "https://127.0.0.1:8201"
log_level = "INFO"
disable_mlock = "true"