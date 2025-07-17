FROM docker.n8n.io/n8nio/n8n

COPY . /packages/n8n-nodes-line-messaging-api
USER root
RUN cd /packages/n8n-nodes-line-messaging-api && \
		pnpm install

RUN cd /packages/n8n-nodes-line-messaging-api && \
		pnpm run build && \
		npm link

USER node