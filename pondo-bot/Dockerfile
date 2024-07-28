FROM node:20 AS build

WORKDIR /aleo-staking/pondo-bot

COPY . .

RUN yarn install && yarn build:prod


FROM node:20-alpine3.19 as production
WORKDIR /aleo-staking/pondo-bot
COPY --from=build /aleo-staking/pondo-bot/src ./src
COPY --from=build /aleo-staking/pondo-bot/node_modules ./node_modules
COPY --from=build /aleo-staking/pondo-bot/dist ./dist
COPY --from=build /aleo-staking/pondo-bot/package.json .
COPY --from=build /aleo-staking/pondo-bot/tsconfig.json .
COPY --from=build /aleo-staking/pondo-bot/.env .
EXPOSE 80
EXPOSE 443
CMD ["yarn", "start:prod"]