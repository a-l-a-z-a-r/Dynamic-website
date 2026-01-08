Monitoring Documentation

What is deployed?: (Prometheus, Grafana, node.exporter and kube-state-metrics)

How to deploy?: 
Bash: 
kubectl apply -f k8s/monitoring/
 
How to access?: 
Bash: 
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/grafana 3000:3000

Verification?: Prometheus sources show UP and grafana charts working.