{{- define "helloworld.name" -}}
{{- default .Chart.Name .Values.app.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "helloworld.fullname" -}}
{{- $name := include "helloworld.name" . -}}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "helloworld.labels" -}}
app.kubernetes.io/name: {{ include "helloworld.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "helloworld.selectorLabels" -}}
app.kubernetes.io/name: {{ include "helloworld.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "helloworld.clusterIssuerName" -}}
{{ printf "%s-issuer" (include "helloworld.fullname" .) }}
{{- end -}}
