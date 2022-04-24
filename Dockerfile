FROM node:15.5-alpine as build-stage
ARG REACT_APP_FAUCET
ARG REACT_APP_CLIENT_ID
ARG REACT_APP_ACCOUNT_HOST
ARG REACT_APP_REDIRECT_URI
ARG REACT_APP_NETWORK_HOST
ARG REACT_APP_SPONSOR_HOST
ARG REACT_APP_SPONSOR_PUB_KEY

ENV REACT_APP_FAUCET ${REACT_APP_FAUCET}
ENV REACT_APP_CLIENT_ID ${REACT_APP_CLIENT_ID}
ENV REACT_APP_ACCOUNT_HOST ${REACT_APP_ACCOUNT_HOST}
ENV REACT_APP_REDIRECT_URI ${REACT_APP_REDIRECT_URI}
ENV REACT_APP_NETWORK_HOST ${REACT_APP_NETWORK_HOST}
ENV REACT_APP_SPONSOR_HOST ${REACT_APP_SPONSOR_HOST}
ENV REACT_APP_SPONSOR_PUB_KEY ${REACT_APP_SPONSOR_PUB_KEY}

WORKDIR /app

COPY . /app

RUN npm i
RUN npm run build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
